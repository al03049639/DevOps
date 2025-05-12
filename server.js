const express                             = require('express');
const session                             = require('express-session');
const bodyParser                          = require('body-parser');
const cookieParser                        = require('cookie-parser'); // Middleware para manejar cookies
const app                                 = express();
const PORT                                = 3000;
const logger                              = require('./logger')
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });
const { v4: uuidv4 } = require('uuid'); 

const { authenticateUser, registerUser }  = require('./auth');
const { calcularTotal } = require('./utils');
const pool = require('./db'); 

app.use(cookieParser()); // Habilita el manejo de cookies
app.use(express.static('public')); // Sirve archivos estáticos desde la carpeta "public"
app.use(session({
    secret: process.env.SESSION_SECRET || "secret_temporal", // Usa un valor por defecto en desarrollo
    resave: false, // Evita guardar la sesión si no hay cambios
    saveUninitialized: false, // No guarda sesiones vacías
    cookie: { 
        secure: process.env.NODE_ENV === 'production', // true solo en HTTPS
        httpOnly: true,
        sameSite: 'Lax' // Previene CSRF
    }
}));
app.use(csrfProtection);
app.use(bodyParser.json());

app.use((err, req, res, next) => {
    if (err.code === 'EBADCSRFTOKEN') {
        res.status(403).json({ error: 'Token CSRF inválido' });
    } else {
        next(err);
    }
});

app.get('/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

/**
 * 📌 Ruta para registrar un nuevo usuario.
 */
app.post('/auth/register', async (req, res) => {
    const { username, password, nombre_completo, email } = req.body;
    const success = await registerUser(username, password, nombre_completo, email);

    if (success) {
        res.json({ message: 'Usuario registrado exitosamente' });
    } else {
        res.status(400).json({ error: 'Usuario o email ya existen' });
    }
});

/**
 * 📌 Ruta para iniciar sesión con cookies de sesión.
 */
app.post('/auth/login', async (req, res) => {
    const { username, password } = req.body;
    const users = await authenticateUser(username, password);

    if (!users) {
        return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    // Almacenar el usuario en la sesión
    req.session.users = users;
    req.session.sessionId = users.sessionId; // Almacenar sessionId en la sesión
    res.json({ message: 'Login exitoso', users });
});

/**
 * 📌 Ruta para verificar si la sesión está activa.
 */
app.get('/auth/session-status', (req, res) => {
    if (req.session.users) {
        res.json({ 
            session: 'active',
            users: {
                username: req.session.users.username,
                nombre_completo: req.session.users.nombre_completo,
                email: req.session.users.email
            }
        });
    } else {
        res.json({ session: 'inactive' });
    }
});

/**
 * 📌 Ruta para cerrar sesión.
 */
app.post('/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ error: 'Error al cerrar sesión' });
        res.clearCookie('connect.sid', { // Añadir opciones claras
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax'
        });
        res.json({ message: 'Sesión cerrada' });
    });
});


/**
 * Inicia el servidor en el puerto definido.
 */
app.listen(PORT, () => logger.logMessage(`Server running on port ${PORT}`));

app.post('/confirmar-pago', async (req, res) => {
    try {
        if (!req.session.users) return res.status(401).json({ error: 'Usuario no autenticado' });
        
        const { cantidades, metodoPago, eventoId } = req.body; 
        
        const total = (cantidades.vip * 2500) + 
                     (cantidades.general * 1500) + 
                     (cantidades.balcon * 800);

        const transactionId = uuidv4();

        await pool.execute(`
            INSERT INTO transactions 
                (transaction_id, user_id, total, payment_method, cant_vip, cant_general, cant_balcon)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            transactionId,
            req.session.users.id,
            total,
            metodoPago,
            cantidades.vip,
            cantidades.general,
            cantidades.balcon
        ]);

        // Actualizar stock del evento
        await pool.execute(`
            UPDATE eventos SET
                boletos_vip = boletos_vip - ?,
                boletos_general = boletos_general - ?,
                boletos_balcon = boletos_balcon - ?
            WHERE id = ?
        `, [
            cantidades.vip,
            cantidades.general,
            cantidades.balcon,
            eventoId
        ]);

        res.json({ transactionId });
    } catch (error) {
        logger.logMessage(`Error en /confirmar-pago: ${error.message}`, 'error');
        res.status(500).json({ error: error.message });
    }
});

// Middleware para verificar admin
const checkAdmin = async (req, res, next) => {
    if (!req.session.users) return res.status(401).json({ error: 'No autenticado' });
    
    const [isAdmin] = await pool.execute(
        'SELECT * FROM administradores WHERE username = ? OR email = ?',
        [req.session.users.username, req.session.users.email]
    );
    
    if (isAdmin.length > 0) {
        next();
    } else {
        res.status(403).json({ error: 'Acceso denegado: No eres administrador' });
    }
};

// --- Rutas de Eventos ---
app.get('/admin/eventos', checkAdmin, async (req, res) => {
    const [eventos] = await pool.execute('SELECT * FROM eventos');
    res.json(eventos);
});

app.post('/admin/eventos', checkAdmin, async (req, res) => {
    const { nombre, fecha, lugar, imagen_url, boletos_vip, boletos_general, boletos_balcon } = req.body;
    await pool.execute(
        'INSERT INTO eventos (nombre, fecha, lugar, imagen_url, boletos_vip, boletos_general, boletos_balcon) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [nombre, fecha, lugar, imagen_url, boletos_vip, boletos_general, boletos_balcon]
    );
    res.json({ success: true });
});

app.put('/admin/eventos/:id', checkAdmin, async (req, res) => {
    const { id } = req.params;
    const { nombre, fecha, lugar, imagen_url, boletos_vip, boletos_general, boletos_balcon } = req.body;
    await pool.execute(
        'UPDATE eventos SET nombre=?, fecha=?, lugar=?, imagen_url=?, boletos_vip=?, boletos_general=?, boletos_balcon=? WHERE id=?',
        [nombre, fecha, lugar, imagen_url, boletos_vip, boletos_general, boletos_balcon, id]
    );
    res.json({ success: true });
});

// --- Rutas de Transacciones ---
app.get('/admin/transacciones', checkAdmin, async (req, res) => {
    const [transacciones] = await pool.execute(`
        SELECT 
            transaction_id,
            total,
            payment_method,
            cant_vip,
            cant_general,
            cant_balcon,
            transaction_date,
            status
        FROM transactions
    `);
    res.json(transacciones);
});
app.put('/admin/transacciones/:id/estado', checkAdmin, async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;
    await pool.execute('UPDATE transactions SET status=? WHERE transaction_id=?', [estado, id]);
    res.json({ success: true });
});


// --- Rutas de Administradores ---
app.get('/admin/whitelist', checkAdmin, async (req, res) => {
    const [admins] = await pool.execute('SELECT * FROM administradores');
    res.json(admins);
});

app.post('/admin/whitelist', checkAdmin, async (req, res) => {
    const { username, email } = req.body;
    
    try {
        // Verificar que el usuario existe
        const [user] = await pool.execute(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [username, email]
        );
        
        if (user.length === 0) throw new Error('Usuario no registrado');

        await pool.execute(
            'INSERT INTO administradores (username, email) VALUES (?, ?)',
            [username, email]
        );
        
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.delete('/admin/whitelist/:id', checkAdmin, async (req, res) => {
    await pool.execute('DELETE FROM administradores WHERE id = ?', [req.params.id]);
    res.json({ success: true });
});

// Nueva ruta para obtener todos los eventos
app.get('/eventos', async (req, res) => {
    const [eventos] = await pool.execute('SELECT * FROM eventos');
    res.json(eventos);
});

// Ruta para obtener un evento por ID
app.get('/eventos/:id', async (req, res) => {
    const [evento] = await pool.execute('SELECT * FROM eventos WHERE id = ?', [req.params.id]);
    res.json(evento[0] || {});
});
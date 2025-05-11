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

function checkAuth(req, res, next) {
  if (req.session.sessionId) {
    next(); // Sesión válida
  } else {
    res.status(401).json({ error: 'No autenticado' });
  }
}

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
        // Verificar sesión
        if (!req.session.users) { // Usar "users" para mantener consistencia
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }

        const { asientos, metodoPago } = req.body;
        const total = calcularTotal(asientos); 

        const transactionId = uuidv4(); 

        await pool.execute(`
            INSERT INTO transactions 
                (transaction_id, user_id, total, seats, payment_method)
            VALUES (?, ?, ?, ?, ?)
        `, [
            transactionId, // Usar el UUID generado
            req.session.users.id,
            total,
            JSON.stringify(asientos),
            metodoPago
        ]);

        res.json({ 
            transactionId // Enviar el UUID al frontend
        });

    } catch (error) {
        logger.logMessage(`Error en /confirmar-pago: ${error.message}`, 'error');
        res.status(500).json({ error: error.message });
    }
});


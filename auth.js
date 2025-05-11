const pool            = require('./db');
const bcrypt          = require('bcrypt');
const logger          = require('./logger')
const { v4: uuidv4 }  = require('uuid'); // UUID for unique session IDs


/**
 * 📌 Verifica si un usuario existe y su contraseña es correcta.
 * @param {string} username - Nombre de usuario
 * @param {string} password - Contraseña en texto plano
 * @returns {object|null} - Datos del usuario + sessionId, o `null` si hay error.
 */
async function authenticateUser(username, password) {
    logger.logMessage('BEGIN authenticateUser()');

    // Obtener más datos del usuario
    const sql = 'SELECT id, username, password, nombre_completo, email FROM users WHERE username = ?';
    const [rows] = await pool.execute(sql, [username]);

    if (rows.length === 0) return null;

    const users = rows[0];
    const isPasswordValid = await bcrypt.compare(password, users.password);
    if (!isPasswordValid) return null;

    const sessionId = uuidv4();
    await storeUserSession(users.id, sessionId);
    
    logger.logMessage('END authenticateUser()');
    return { 
        id: users.id,
        username: users.username,
        nombre_completo: users.nombre_completo,
        email: users.email,
        sessionId 
    };
}

/**
 * 📌 Registra un nuevo usuario en la base de datos con contraseña hasheada.
 * @param {string} username - Nombre de usuario
 * @param {string} password - Contraseña en texto plano
 * @param {string} nombre_completo - Nombre completo del usuario
 * @param {string} email - Correo electrónico
 * @returns {boolean} - `true` si el usuario fue creado, `false` si ya existía.
 */
async function registerUser(username, password, nombre_completo, email) {
    logger.logMessage('BEGIN registerUser()');

    // Verificar si el usuario o email ya existen
    const [existingUser] = await pool.execute(
        'SELECT id FROM users WHERE username = ? OR email = ?',
        [username, email]
    );
    
    if (existingUser.length > 0) return false;

    // Hashear contraseña e insertar nuevo usuario
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.execute(
        'INSERT INTO users (username, password, nombre_completo, email) VALUES (?, ?, ?, ?)',
        [username, hashedPassword, nombre_completo, email]
    );

    logger.logMessage('END registerUser()');
    return true;
}

/**
 * 📌 Almacena una sesión en la base de datos cuando el usuario inicia sesión.
 * @param {number} userId - ID del usuario autenticado.
 * @param {string} sessionId - ID único de sesión.
 */
async function storeUserSession(userId, sessionId) {
    try {
        logger.logMessage(`🔐 Storing session: UserID = ${userId}, SessionID = ${sessionId}`);
        await pool.execute('INSERT INTO user_session (user_id, session_id, created_at) VALUES (?, ?, NOW())', [userId, sessionId]);
        logger.logMessage('✅ Session stored successfully.');
    } catch (error) {
        console.error('❌ Error storing session:', error.message);
    }
}

module.exports = { authenticateUser, registerUser, storeUserSession };


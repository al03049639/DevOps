const mysql  = require('mysql2/promise');
const logger = require('./logger')
require('dotenv').config();

// Create a connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    port: process.env.DB_PORT
});

// Test database connection on startup
(async () => {
    try {
        const connection = await pool.getConnection();
     // logger.logMessage('✅ MySQL Connected Successfully!');
        logger.logMessage('✅ MySQL Connected Successfully!', "info")
        connection.release(); // Release the connection back to the pool
    } catch (error) {
    //  console.error('❌ MySQL Connection Failed:', error.message);
        logger.logMessage('❌ MySQL Connection Failed:' + error.message, "error")
        process.exit(1); // Exit process if DB connection fails
    }
})();

// Handle unexpected errors & shutdown gracefully
process.on('SIGINT', async () => {
    try {
        logger.logMessage('⚠️ Closing MySQL Connection Pool...');
        await pool.end();
        logger.logMessage('✅ MySQL Pool Closed Successfully.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error Closing MySQL Pool:', error.message);
        process.exit(1);
    }
});

module.exports = pool;

const fs       = require('fs');
const path     = require('path');

const logFilePath = path.join(__dirname, 'logs.log');

console.log = function (message) {
    fs.appendFileSync(logFilePath, message + '\n');
    process.stdout.write(message + '\n'); // También puedes mostrarlo en la consola si lo deseas 
}

async function logMessage(message, logLevel = 'debug') {
    const logLevels = ['error', 'warn', 'info', 'debug'];
    let color = '';

    if (!logLevels.includes(logLevel)) {
        logLevel = 'info';
    }

    switch (logLevel) {
        case 'error':
            color = '\x1b[31m'; // rojo
            break;
        case 'debug':
            color = '\x1b[33m'; // amarillo
            break;
        case 'info':
            color = '\x1b[36m'; // cian
            break;
        case 'warn':
            color = '\x1b[35m'; // magenta
            break;
        default:
            color = '\x1b[0m'; // color por defecto
            break;
    }
    const dateTime = formatDate(new Date());
    console.log(color + `[${dateTime}] [${logLevel.toUpperCase()}] ${message}` + '\x1b[0m');
};


const formatDate = (date) => {
    return date.getFullYear() + ":" +
        String(date.getMonth() + 1).padStart(2, '0') + ":" +
        String(date.getDate()).padStart(2, '0') + " " +
        String(date.getHours()).padStart(2, '0') + ":" +
        String(date.getMinutes()).padStart(2, '0') + ":" +
        String(date.getSeconds()).padStart(2, '0');
};

module.exports = {
    logMessage
};
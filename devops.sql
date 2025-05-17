-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS devopsdb;
USE devopsdb;

-- Crear tabla de usuarios
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    nombre_completo VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE
);

-- Crear tabla de sesiones de usuario
CREATE TABLE user_session (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Crear tabla de logs
CREATE TABLE logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message TEXT NOT NULL,
    log_level VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de eventos
CREATE TABLE eventos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    fecha DATETIME NOT NULL,
    lugar VARCHAR(255) NOT NULL,
    imagen_url TEXT NOT NULL,
    boletos_vip INT DEFAULT 0,
    boletos_general INT DEFAULT 0,
    boletos_balcon INT DEFAULT 0
);

-- Insertar eventos
INSERT INTO eventos (nombre, fecha, lugar, imagen_url, boletos_vip, boletos_general, boletos_balcon) VALUES
('Bring Me The Horizon', '2024-07-05 20:00:00', 'Ciudad de México', 'https://es.concerts-metal.com/images/flyers/202306/1686509190--Bring-Me-The-Horizon---Tour-2024.webp', 100, 300, 200),
('Bad Omens', '2024-08-10 19:30:00', 'Guadalajara', 'https://es.concerts-metal.com/images/flyers/202304/1680589361.webp', 0, 30, 0),
('My Chemical Romance', '2024-09-22 21:00:00', 'Monterrey', 'https://wdhafm.com/uploads/2024/11/My-Chemical-Romance-8-9-25_Featured.jpg', 0, 0, 0);

-- Crear tabla de transacciones
CREATE TABLE transactions (
    transaction_id VARCHAR(36) PRIMARY KEY,
    user_id INT NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    payment_method ENUM('debito', 'credito', 'paypal') NOT NULL,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pendiente', 'completada', 'cancelada') DEFAULT 'pendiente',
    evento_id INT,
    cant_vip INT NOT NULL DEFAULT 0,
    cant_general INT NOT NULL DEFAULT 0,
    cant_balcon INT NOT NULL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE SET NULL
);

-- Crear tabla de administradores
CREATE TABLE administradores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE,
    FOREIGN KEY (email) REFERENCES users(email) ON DELETE CASCADE
);

-- Insertar usuario administrador por defecto (usuario admin, contraseña admin)
INSERT INTO users (username, password, nombre_completo, email) 
VALUES ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqL3Q8IYJZJY1x4P6CTR3Sqh7Dp8u', 'Administrador Principal', 'admin@example.com');

INSERT INTO administradores (username, email)
VALUES ('admin', 'admin@example.com');
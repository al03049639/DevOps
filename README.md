# **Boleticket** - Sistema de Gestión de Eventos y Ventas de Boletos
## 📝 Descripción
Boleticket es una plataforma completa para la gestión de eventos y venta de boletos en línea, con:

Sistema de autenticación de usuarios

Panel de administración

Proceso de compra seguro

Generación de códigos QR para validación

## **🛠️ Tecnologías**
**Backend:** Node.js, Express, MySQL

**Frontend:** HTML5, CSS3, JavaScript (Vanilla)

**Seguridad:** CSRF Tokens, Bcrypt, Express-Session

**Dependencias:**

**mysql2:** Conexión a base de datos

**express-session:** Manejo de sesiones

**csurf:** Protección CSRF

**uuid:** Generación de IDs únicos

**qrcode.js:** Generación de códigos QR

## **🗃️ Estructura de Base de Datos**

### **Base de datos:**
La estructura de la base de datos se define en el archivo **devops.sql**.

### **Configuración del Entorno (.env)**
### **.env**

DB_HOST = localhost  
DB_USER = root  
DB_PASSWORD = "Alha8765#5678"  # ¡Cambiar por tu contraseña de MySQL!  
DB_NAME = devopsdb  
SESSION_SECRET = securepassword$  
PORT = 3306  
DB_SSL = false  

### **Asegúrate de:**
Actualizar **DB_PASSWORD** con tu contraseña real de MySQL.
Crear previamente la base de datos devopsdb en tu servidor MySQL.

## **🔄 Endpoints Principales**
### **Autenticación**
POST /auth/register - Registro de usuarios

POST /auth/login - Inicio de sesión

GET /auth/session-status - Verificar sesión

POST /auth/logout - Cerrar sesión

### **Eventos**
GET /eventos - Listar todos los eventos

GET /eventos/:id - Obtener evento específico

POST /admin/eventos - Crear evento (Admin)

PUT /admin/eventos/:id - Actualizar evento (Admin)

DELETE /admin/eventos/:id - Eliminar evento (Admin)

### **Transacciones**
POST /confirmar-pago - Procesar pago

GET /admin/transacciones - Listar transacciones (Admin)

PUT /admin/transacciones/:id/estado - Cambiar estado (Admin)

## **🚀 Instalación**
### **Clonar repositorio:**

### **bash**
git clone https://github.com/al03049639/DevOps.git

### **Instalar dependencias:**

### **bash**
npm install

### **Configurar variables de entorno (crear .env):**

Recuerda crear la base de datos en MySQL y configurar las variables de entorno

### **bash**
node server.js

## **🖥️ Vistas Principales**
**Página Principal:** Listado de eventos disponibles

**Página de Compra:** Selección de boletos y pago

**Panel Admin:** Gestión de eventos, transacciones y administradores

## ✅ **Funcionalidades Clave**
**Compra Segura:** Transacciones atómicas con rollback automático

**QR Dinámico:** Generación en tiempo real con datos del evento

**Validación en Tiempo Real:** Para métodos de pago

**Responsive:** Adaptable a dispositivos móviles

## **📄 Licencia**
**MIT License**

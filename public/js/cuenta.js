document.addEventListener('DOMContentLoaded', () => {
    // Manejo de login
    if(document.getElementById('loginForm')) {
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const csrfResponse = await fetch('/csrf-token');
            const csrfData = await csrfResponse.json();
            
            const data = {
                username: e.target.username.value,
                password: e.target.password.value
            };

            try {
                const response = await fetch('/auth/login', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': csrfData.csrfToken // Token en header
                    },
                    credentials: 'include', // Para cookies
                    body: JSON.stringify(data)
                });

                const result = await response.json();
                
                if(response.ok) {
                    window.location.href = 'index.html';
                } else {
                    alert(result.error || 'Error en el login');
                }
            } catch (error) {
                alert('Error de conexión');
            }
        });
    }

    // Manejo de registro
    if(document.getElementById('registerForm')) {
        document.getElementById('registerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const csrfResponse = await fetch('/csrf-token');
            const csrfData = await csrfResponse.json();

            
            const data = {
                nombre_completo: e.target.nombre.value,
                email: e.target.email.value,
                username: e.target.username.value,
                password: e.target.password.value
            };

            try {
                const response = await fetch('/auth/register', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': csrfData.csrfToken // Token en header
                    },
                    credentials: 'include', // Para cookies
                    body: JSON.stringify(data)
                });

                const result = await response.json();
                
                if(response.ok) {
                    alert('Registro exitoso! Redirigiendo...');
                    window.location.href = 'login.html';
                } else {
                    alert(result.error || 'Error en el registro');
                }
            } catch (error) {
                alert('Error de conexión');
            }
        });
    }
    // Manejo de sesión y logout
    const setupSession = async () => {
        const accountLink = document.getElementById('accountLink');
        const userPanel = document.getElementById('userPanel');
        const usernameDisplay = document.getElementById('usernameDisplay');
        const logoutBtn = document.getElementById('logoutBtn');

        // Obtener token CSRF
        let csrfToken = '';
        try {
            const csrfResponse = await fetch('/csrf-token');
            const csrfData = await csrfResponse.json();
            csrfToken = csrfData.csrfToken;
        } catch (error) {
            console.error('Error obteniendo CSRF:', error);
        }

        // Verificar estado de sesión
        try {
            const response = await fetch('/auth/session-status');
            const { session, users } = await response.json();
            
            if(session === 'active' && users) {
                accountLink.style.display = 'none';
                userPanel.style.display = 'inline-flex';
                usernameDisplay.textContent = users.username;
                // Mostrar enlace de admin si es administrador
                fetch('/admin/whitelist')
                .then(res => res.json())
                .then(admins => {
                    const esAdmin = admins.some(a => a.username === users.username);
                    if (esAdmin) {
                        document.getElementById('adminLink').style.display = 'inline';
                    }
                });
            }
        } catch (error) {
            console.error('Error verificando sesión:', error);
        }

        // Manejar logout
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    const response = await fetch('/auth/logout', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-Token': csrfToken
                        },
                        credentials: 'include'
                    });

                    if (response.ok) {
                        window.location.href = 'login.html';
                    } else {
                        const errorData = await response.json();
                        alert(errorData.error || 'Error al cerrar sesión');
                    }
                } catch (error) {
                    alert('Error de conexión al cerrar sesión');
                }
            });
        }
    };

    // Ejecutar configuración de sesión
    setupSession();
});
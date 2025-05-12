document.addEventListener('DOMContentLoaded', async () => {
    let eventoEditando = null;

    // Cargar eventos y transacciones
    const cargarDatos = async () => {
        const eventos = await fetch('/admin/eventos').then(res => res.json());
        const transacciones = await fetch('/admin/transacciones').then(res => res.json());

        // Renderizar eventos
        const listaEventos = document.getElementById('listaEventos');
        listaEventos.innerHTML = eventos.map(evento => `
            <div class="evento-card">
                <img src="${evento.imagen_url}" alt="${evento.nombre}">
                <h3>${evento.nombre}</h3>
                <p>📅 ${new Date(evento.fecha).toLocaleDateString()}</p>
                <p>🏟️ ${evento.lugar}</p>
                <p>🎟️ VIP: ${evento.boletos_vip} | General: ${evento.boletos_general} | Balcón: ${evento.boletos_balcon}</p>
                <button class="editar-evento" data-id="${evento.id}">✏️ Editar</button>
                <button class="eliminar-evento" data-id="${evento.id}">🗑️ Eliminar</button>
            </div>
        `).join('');

        // Renderizar transacciones
        const detalleTransacciones = document.getElementById('detalleTransacciones');
        detalleTransacciones.innerHTML = transacciones.map(t => `
            <div class="transaccion">
                <p>ID: ${t.transaction_id}</p>
                <p>Evento: ${t.evento_nombre || 'No asociado'}</p>
                <p>Total: $${t.total} | Estado: 
                    <span class="status-badge ${t.status}">${t.status}</span>
                    <select class="cambiar-estado" data-id="${t.transaction_id}">
                        <option ${t.status === 'pendiente' ? 'selected' : ''}>pendiente</option>
                        <option ${t.status === 'completada' ? 'selected' : ''}>completada</option>
                        <option ${t.status === 'cancelada' ? 'selected' : ''}>cancelada</option>
                    </select>
                </p>
            </div>
        `).join('');
    };

    // Abrir modal para nuevo/editar evento
    document.getElementById('nuevoEventoBtn').addEventListener('click', () => {
        eventoEditando = null;
        document.getElementById('eventoModal').style.display = 'flex';
    });

    // Guardar evento
    document.getElementById('guardarEventoBtn').addEventListener('click', async () => {
        const eventoData = {
            nombre: document.getElementById('eventoNombre').value,
            fecha: document.getElementById('eventoFecha').value,
            lugar: document.getElementById('eventoLugar').value,
            imagen_url: document.getElementById('eventoImagen').value,
            boletos_vip: parseInt(document.getElementById('boletosVIP').value) || 0,
            boletos_general: parseInt(document.getElementById('boletosGeneral').value) || 0,
            boletos_balcon: parseInt(document.getElementById('boletosBalcon').value) || 0
        };

        try {
            const csrfToken = await fetch('/csrf-token').then(res => res.json()).then(data => data.csrfToken);
            
            const endpoint = eventoEditando ? `/admin/eventos/${eventoEditando}` : '/admin/eventos';
            const method = eventoEditando ? 'PUT' : 'POST';

            const response = await fetch(endpoint, {
                method,
                headers: { 
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken
                },
                body: JSON.stringify(eventoData)
            });

            if (!response.ok) throw new Error('Error al guardar');

            // Limpiar formulario después de guardar
            if (!eventoEditando) {
                document.querySelectorAll('#eventoModal input').forEach(input => input.value = '');
            }

            cargarDatos();
            document.getElementById('eventoModal').style.display = 'none';
            
        } catch (error) {
            alert(error.message);
        }
    });

    // Delegación de eventos para editar
    document.getElementById('listaEventos').addEventListener('click', async (e) => {
        if (e.target.classList.contains('editar-evento')) {
            const id = e.target.dataset.id;
            
            // Obtener datos completos del evento
            const evento = await fetch(`/admin/eventos/${id}`).then(res => res.json());
            
            // Llenar formulario
            document.getElementById('eventoNombre').value = evento.nombre;
            document.getElementById('eventoFecha').value = evento.fecha.slice(0, 16); // Formato datetime-local
            document.getElementById('eventoLugar').value = evento.lugar;
            document.getElementById('eventoImagen').value = evento.imagen_url;
            document.getElementById('boletosVIP').value = evento.boletos_vip;
            document.getElementById('boletosGeneral').value = evento.boletos_general;
            document.getElementById('boletosBalcon').value = evento.boletos_balcon;
            
            eventoEditando = id;
            document.getElementById('eventoModal').style.display = 'flex';
        }
    });

    // Delegación de eventos para eliminar
    document.getElementById('listaEventos').addEventListener('click', async (e) => {
        if (e.target.classList.contains('eliminar-evento')) {
            const button = e.target;
            button.disabled = true;
            button.textContent = 'Eliminando...';

            if (confirm('¿Eliminar este evento permanentemente?')) {
                try {
                    // Obtener CSRF Token
                    const csrfToken = await fetch('/csrf-token')
                        .then(res => res.json())
                        .then(data => data.csrfToken);

                    // Enviar solicitud DELETE con token
                    const response = await fetch(`/admin/eventos/${button.dataset.id}`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-Token': csrfToken
                        }
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Error al eliminar');
                    }

                    // Eliminar tarjeta visualmente
                    button.closest('.evento-card').remove();

                } catch (error) {
                    alert(error.message);
                }
            }
            
            // Restaurar botón
            button.disabled = false;
            button.textContent = '🗑️ Eliminar';
        }
    });

    // Cambiar estado de transacción
    document.getElementById('detalleTransacciones').addEventListener('change', async (e) => {
        if (e.target.classList.contains('cambiar-estado')) {
            const select = e.target;
            const statusBadge = select.previousElementSibling; // Elemento <span> hermano
            
            try {
                const csrfToken = await fetch('/csrf-token').then(res => res.json()).then(data => data.csrfToken);
                
                const response = await fetch(`/admin/transacciones/${select.dataset.id}/estado`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': csrfToken
                    },
                    body: JSON.stringify({ estado: select.value })
                });

                if (!response.ok) throw new Error('Error en el servidor');

                // Actualizar UI
                statusBadge.textContent = select.value;
                statusBadge.className = `status-badge ${select.value}`;

            } catch (error) {
                alert(error.message);
                select.value = statusBadge.textContent; // Revertir al valor original
            }
        }
    });

    // Cargar lista de administradores
    const cargarAdmins = async () => {
        const admins = await fetch('/admin/whitelist').then(res => res.json());
        
        document.getElementById('listaAdmins').innerHTML = admins.map(admin => `
            <div class="admin-card">
                <span>👑 ${admin.username}</span>
                <small>${admin.email}</small>
                ${admin.username !== 'vinoshiba' ? 
                    `<button class="eliminar-admin" data-id="${admin.id}">🗑️ Eliminar</button>` : 
                    '<small>(Administrador principal)</small>'
                }
            </div>
        `).join('');
    };

    // Agregar administrador
    document.getElementById('addAdminBtn').addEventListener('click', async () => {
        const identificador = document.getElementById('inputAdmin').value;
        
        try {
            const response = await fetch('/admin/whitelist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: identificador.includes('@') ? null : identificador,
                    email: identificador.includes('@') ? identificador : null
                })
            });
            
            if (!response.ok) throw new Error(await response.text());
            cargarAdmins();
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    });

    // Eliminar administrador
    document.getElementById('listaAdmins').addEventListener('click', async (e) => {
        if (e.target.classList.contains('eliminar-admin')) {
            await fetch(`/admin/whitelist/${e.target.dataset.id}`, { method: 'DELETE' });
            cargarAdmins();
        }
    });

    // Inicializar
    cargarAdmins();

    // Carga inicial
    cargarDatos();

    const ctx = document.getElementById('graficoVentas').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['VIP', 'General', 'Balcón'],
            datasets: [{
                label: 'Boletos Vendidos',
                data: [totalVIP, totalGeneral, totalBalcon],
                backgroundColor: ['#ff6384', '#36a2eb', '#cc65fe']
            }]
        }
    });

    // Cerrar modal
    document.querySelector('.close-modal').addEventListener('click', () => {
        document.getElementById('eventoModal').style.display = 'none';
    });

    // Cerrar al hacer clic fuera
    document.getElementById('eventoModal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('eventoModal')) {
            document.getElementById('eventoModal').style.display = 'none';
        }
    });
});
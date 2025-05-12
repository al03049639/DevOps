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
            </div>
        `).join('');

        // Renderizar transacciones
        const detalleTransacciones = document.getElementById('detalleTransacciones');
        detalleTransacciones.innerHTML = transacciones.map(t => `
            <div class="transaccion">
                <p>ID: ${t.transaction_id}</p>
                <p>Evento: ${t.evento_nombre || 'N/A'}</p>
                <p>Total: $${t.total} | Estado: 
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
            boletos_vip: document.getElementById('boletosVIP').value,
            boletos_general: document.getElementById('boletosGeneral').value,
            boletos_balcon: document.getElementById('boletosBalcon').value
        };

        const endpoint = eventoEditando ? `/admin/eventos/${eventoEditando}` : '/admin/eventos';
        await fetch(endpoint, {
            method: eventoEditando ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventoData)
        });

        cargarDatos();
        document.getElementById('eventoModal').style.display = 'none';
        
        await pool.execute(
            'UPDATE eventos SET boletos_vip=?, boletos_general=?, boletos_balcon=? WHERE id=?',
            [eventoData.boletos_vip, eventoData.boletos_general, eventoData.boletos_balcon, id]
        );
    });

    // Delegación de eventos para editar
    document.getElementById('listaEventos').addEventListener('click', async (e) => {
        if (e.target.classList.contains('editar-evento')) {
            const id = e.target.dataset.id;
            const evento = await fetch(`/admin/eventos/${id}`).then(res => res.json());
            // Rellenar modal con datos del evento...
            eventoEditando = id;
            document.getElementById('eventoModal').style.display = 'flex';
        }
    });

    // Cambiar estado de transacción
    document.getElementById('detalleTransacciones').addEventListener('change', async (e) => {
        if (e.target.classList.contains('cambiar-estado')) {
            await fetch(`/admin/transacciones/${e.target.dataset.id}/estado`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: e.target.value })
            });
            cargarDatos();
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
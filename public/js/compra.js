let csrfToken;
let evento; 
let total = 0; 
let qrGenerated = false;

// Dentro del evento click de .btn-pagar (antes del fetch)
const generarQR = () => {
    if (qrGenerated) return;
    
    // Obtener datos necesarios
    const datosQR = {
        nombre: document.getElementById('nombre').value,
        email: document.getElementById('correo').value,
        evento: evento.nombre,
        lugar: evento.lugar,
        fecha: new Date(evento.fecha).toLocaleDateString('es-MX', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }),
        boletos: {
            vip: document.getElementById('vipQty').value,
            general: document.getElementById('generalQty').value,
            balcon: document.getElementById('balconQty').value
        }
    };

    // Formatear texto del QR
    const textoQR = `
    🎟️ Boleticket - Compra verificada
    --------------------------------
    👤 Nombre: ${datosQR.nombre}
    📧 Email: ${datosQR.email}
    
    🎵 Evento: ${datosQR.evento}
    📍 Lugar: ${datosQR.lugar}
    🕑 Fecha: ${datosQR.fecha}
    
    🎫 Boletos:
    VIP: ${datosQR.boletos.vip}
    General: ${datosQR.boletos.general}
    Balcón: ${datosQR.boletos.balcon}
    
    🔒 Código de verificación: ${uuidv4().substring(0, 8).toUpperCase()}
    `;

    // Generar QR
    const qrContainer = document.createElement('div');
    qrContainer.id = 'qrContainer';
    qrContainer.style.marginTop = '20px';
    qrContainer.style.textAlign = 'center';
    
    document.querySelector('.modal-content').appendChild(qrContainer);

    new QRCode(qrContainer, {
        text: textoQR,
        width: 180,
        height: 180,
        colorDark: "#0071ce",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });

    // Agregar texto debajo del QR
    const qrText = document.createElement('p');
    qrText.style.fontSize = '0.9em';
    qrText.style.color = '#666';
    qrText.textContent = 'Presente este código en la entrada del evento';
    qrContainer.appendChild(qrText);

    qrGenerated = true;
};

async function obtenerCSRFToken() {
    const response = await fetch('/csrf-token');
    const data = await response.json();
    csrfToken = data.csrfToken;
}

async function cargarEvento() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const eventoId = urlParams.get('id');
        const response = await fetch(`/eventos/${eventoId}`);
        evento = await response.json();
        actualizarDisponibilidad();
        actualizarPrecio();
    } catch (error) {
        alert("Error al cargar el evento");
    }
}

function actualizarDisponibilidad() {
    const vipQty = parseInt(document.getElementById('vipQty').value) || 0;
    const generalQty = parseInt(document.getElementById('generalQty').value) || 0;
    const balconQty = parseInt(document.getElementById('balconQty').value) || 0;
    
    document.getElementById('vipDisponible').textContent = `Disponibles: ${evento.boletos_vip - vipQty}`;
    document.getElementById('generalDisponible').textContent = `Disponibles: ${evento.boletos_general - generalQty}`;
    document.getElementById('balconDisponible').textContent = `Disponibles: ${evento.boletos_balcon - balconQty}`;
}

function actualizarPrecio() {
    const vipQty = parseInt(document.getElementById('vipQty').value) || 0;
    const generalQty = parseInt(document.getElementById('generalQty').value) || 0;
    const balconQty = parseInt(document.getElementById('balconQty').value) || 0;
    
    total = (vipQty * 2500) + (generalQty * 1500) + (balconQty * 800);
    document.getElementById('precio-total').textContent = `Total: $${total} MXN`;
}

document.addEventListener('DOMContentLoaded', async () => {
    await obtenerCSRFToken();
    await cargarEvento();
    const precioTotal = document.getElementById('precio-total');
    const modal = document.getElementById('modal');
    const metodoPago = document.getElementById('metodo-pago');
    
    
    // ========== [Confirmar compra actualizado] ========== //
    const btnConfirmar = document.querySelector('.btn-confirmar');
    btnConfirmar.addEventListener('click', async () => {
        const vipQty = parseInt(document.getElementById('vipQty').value) || 0;
        const generalQty = parseInt(document.getElementById('generalQty').value) || 0;
        const balconQty = parseInt(document.getElementById('balconQty').value) || 0;
         // Verificar sesión y autocompletar antes de abrir el modal
        const sessionCheck = await fetch('/auth/session-status');
        const sessionData = await sessionCheck.json();
        
        if (sessionData.session === 'active' && sessionData.users) {
            document.getElementById('nombre').value = sessionData.users.nombre_completo;
            document.getElementById('correo').value = sessionData.users.email;
        }
        if (vipQty + generalQty + balconQty === 0) {
            alert('Selecciona al menos un boleto');
            return;
        }
        modal.style.display = 'flex';
    });
    
    // Manejar método de pago
    metodoPago.addEventListener('change', () => {
        const extraFields = document.getElementById('extra-fields');

        if (metodoPago.value === 'paypal') {
            extraFields.innerHTML = `
                <input type="email" id="paypal-email" placeholder="Correo PayPal" required>
            `;
        } else if (metodoPago.value === 'debito' || metodoPago.value === 'credito') {
            extraFields.innerHTML = `
                <input type="text" id="tarjeta-numero" placeholder="Número de tarjeta" maxlength="19" required>
                <input type="text" id="tarjeta-titular" placeholder="Nombre del titular" required>
                <input type="text" id="tarjeta-vencimiento" placeholder="Fecha de vencimiento (MM/AA)" pattern="^(0[1-9]|1[0-2])\/\\d{2}$" required>
                <input type="text" id="tarjeta-cvv" placeholder="CVV" maxlength="4" pattern="\\d{3,4}" required>
            `;
        } else {
            extraFields.innerHTML = '';
        }
    });

    document.querySelectorAll('.btn-plus, .btn-minus').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tipo = e.target.dataset.tipo;
            const input = document.getElementById(`${tipo}Qty`);
            const max = evento[`boletos_${tipo}`];
            
            const currentValue = parseInt(input.value) || 0;
            const increment = e.target.classList.contains('btn-plus') ? 1 : -1;
            const nuevoValor = Math.max(0, Math.min(max, currentValue + increment));
            
            input.value = nuevoValor;
            actualizarDisponibilidad();
            actualizarPrecio();
        });
    });
    
    // Cerrar modal
    window.onclick = (e) => e.target === modal && (modal.style.display = 'none');
    
    document.querySelector('.btn-pagar').addEventListener('click', async () => {
        const nombre = document.getElementById('nombre').value;
        const email = document.getElementById('correo').value;
        const metodoPago = document.getElementById('metodo-pago').value;
        const cantidades = {
            vip: parseInt(document.getElementById('vipQty').value) || 0,
            general: parseInt(document.getElementById('generalQty').value) || 0,
            balcon: parseInt(document.getElementById('balconQty').value) || 0
        };

        const eventoId = new URLSearchParams(window.location.search).get('id');

        // Validaciones primero
        if (!nombre.trim()) {
        alert('Por favor ingresa tu nombre completo');
        return;
        }
        
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            alert('Correo electrónico inválido');
            return;
        }

        if (!metodoPago) {
        alert('Selecciona un método de pago');
        return;
        }

        // Validar campos específicos para tarjetas
        if (metodoPago === 'debito' || metodoPago === 'credito') {
        const tarjetaNumero = document.getElementById('tarjeta-numero')?.value.replaceAll(" ", "");
        const tarjetaTitular = document.getElementById('tarjeta-titular')?.value.trim();
        const tarjetaVencimiento = document.getElementById('tarjeta-vencimiento')?.value;
        const tarjetaCVV = document.getElementById('tarjeta-cvv')?.value;

        // Validar que todos los campos existan
        if (!tarjetaNumero || !tarjetaTitular || !tarjetaVencimiento || !tarjetaCVV) {
            alert('Completa todos los campos de la tarjeta');
            return;
        }

        // Validar formato del número de tarjeta (16 dígitos)
        if (!/^\d{16}$/.test(tarjetaNumero)) {
            alert('Número de tarjeta inválido. Debe tener 16 dígitos');
            return;
        }

        // Validar formato de fecha (MM/AA)
        if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(tarjetaVencimiento)) {
            alert('Fecha de vencimiento inválida. Usa el formato MM/AA');
            return;
        }

        // Validar CVV (3 o 4 dígitos)
        if (!/^\d{3,4}$/.test(tarjetaCVV)) {
            alert('CVV inválido. Debe tener 3 o 4 dígitos');
            return;
        }
        }

        // Validar PayPal
        if (metodoPago === 'paypal') {
            const paypalEmail = document.getElementById('paypal-email')?.value;
            if (!/^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/.test(paypalEmail)) {
                alert('Correo de PayPal inválido');
                return;
            }
        }

        try {

            const response = await fetch('/confirmar-pago', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': document.getElementById('csrf-token').value
                },
                body: JSON.stringify({
                    nombre,
                    email,
                    cantidades,
                    metodoPago,
                    eventoId,
                    total
                }),
                credentials: 'include'
            });

            if (!response.ok) {
                let errorMessage;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error;
                } catch {
                    errorMessage = await response.text();
                }
                throw new Error(errorMessage || `Error ${response.status}`);
            }

            const { transactionId } = await response.json();
        
            const modalContent = document.querySelector('.modal-content');
            
            const qrDiv = document.createElement('div');
            new QRCode(qrDiv, {
                text: `ID: ${transactionId}\nCorreo: ${email}\nTotal: $${total} MXN`,
                width: 180,
                height: 180
            });

            modalContent.innerHTML = `
                <h2>¡Compra exitosa!</h2>
                <p>Transaction ID: ${transactionId}</p>
            `;
            modalContent.appendChild(qrDiv);

            const volverBtn = document.createElement('button');
            volverBtn.textContent = 'Volver a inicio';
            volverBtn.classList.add('btn-volver');
            volverBtn.addEventListener('click', () => {
                window.location.href = 'index.html';
            });
            modalContent.appendChild(volverBtn);

        } catch (error) {
            if (error.message.includes('401')) {
                alert('Sesión expirada. Por favor, inicia sesión nuevamente.');
                window.location.href = 'login.html';
            } else {
                alert(`Error: ${error.message}`);
            }
        }
    });

});
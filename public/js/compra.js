let csrfToken;

async function obtenerCSRFToken() {
    const response = await fetch('/csrf-token');
    const data = await response.json();
    csrfToken = data.csrfToken;
}

document.addEventListener('DOMContentLoaded', () => {
    obtenerCSRFToken();
    const seats = document.querySelectorAll('.seat:not(.occupied)');
    const btnConfirmar = document.querySelector('.btn-confirmar');
    const precioTotal = document.getElementById('precio-total');
    const modal = document.getElementById('modal');
    const metodoPago = document.getElementById('metodo-pago');
    
    // Selección de asientos
    seats.forEach(seat => {
        seat.addEventListener('click', () => {
            seat.classList.toggle('selected');
            actualizarTotal();
        });
    });
    
    // Actualizar precio total
    function actualizarTotal() {
        const selected = document.querySelectorAll('.seat.selected');
        let total = 0;
        selected.forEach(seat => total += parseInt(seat.dataset.precio));
        precioTotal.textContent = `Total: $${total} MXN`;
    }
    
    // Confirmar compra
    btnConfirmar.addEventListener('click', async () => {
        if (document.querySelectorAll('.seat.selected').length > 0) {
        // Verificar sesión y autocompletar antes de abrir el modal
        const sessionCheck = await fetch('/auth/session-status');
        const sessionData = await sessionCheck.json();
        
        if (sessionData.session === 'active' && sessionData.users) {
            document.getElementById('nombre').value = sessionData.users.nombre_completo;
            document.getElementById('correo').value = sessionData.users.email;
        }

            modal.style.display = 'flex';
        } else {
            alert('Selecciona al menos un asiento');
        }
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


    
    // Cerrar modal
    window.onclick = (e) => e.target === modal && (modal.style.display = 'none');
    
    document.querySelector('.btn-pagar').addEventListener('click', async () => {
        const nombre = document.getElementById('nombre').value;
        const email = document.getElementById('correo').value;
        const metodoPago = document.getElementById('metodo-pago').value;
        const selectedSeats = Array.from(document.querySelectorAll('.seat.selected')).map(seat => seat.textContent.trim());
        const selected = document.querySelectorAll('.seat.selected');
        const total = Array.from(selected).reduce((sum, seat) => sum + parseInt(seat.dataset.precio), 0);


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
            // Verificar sesión activa
            const sessionCheck = await fetch('/auth/session-status');
            const sessionData = await sessionCheck.json();

            const response = await fetch('/confirmar-pago', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': document.getElementById('csrf-token').value
                },
                body: JSON.stringify({
                    nombre,
                    email,
                    asientos: selectedSeats,
                    metodoPago
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
                text: `ID: ${transactionId}\nTotal: $${total} MXN`,
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
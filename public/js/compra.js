document.addEventListener('DOMContentLoaded', () => {
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
    btnConfirmar.addEventListener('click', () => {
        if (document.querySelectorAll('.seat.selected').length > 0) {
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
    
    // Generar QR
    document.querySelector('.btn-pagar').addEventListener('click', () => {
    const nombre = document.getElementById('nombre').value;
    const total = precioTotal.textContent;

    if (nombre) {
        const qrDiv = document.createElement('div');
        new QRCode(qrDiv, {
            text: `Nombre: ${nombre}\n${total}`,
            width: 180,
            height: 180
        });

        const modalContent = document.querySelector('.modal-content');
        modalContent.innerHTML = `
            <h2>¡Compra exitosa!</h2>
            <p>Presenta este QR en la entrada:</p>
        `;
        modalContent.appendChild(qrDiv);

        // Crear botón de volver a inicio
        const volverBtn = document.createElement('button');
        volverBtn.textContent = 'Volver a inicio';
        volverBtn.classList.add('btn-volver');
        volverBtn.style.marginTop = '20px';

        // Redirigir al inicio
        volverBtn.addEventListener('click', () => {
            window.location.href = 'index.html'; // Asegúrate de que este sea el nombre correcto de la página principal
        });

        modalContent.appendChild(volverBtn);
    }
});
});
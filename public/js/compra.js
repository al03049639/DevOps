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
        extraFields.innerHTML = metodoPago.value === 'paypal' ? 
            '<input type="email" placeholder="Correo PayPal">' : 
            '<input type="text" placeholder="Número de tarjeta">';
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
            
            document.querySelector('.modal-content').innerHTML = `
                <h2>¡Compra exitosa!</h2>
                <p>Presenta este QR en la entrada:</p>
            `;
            document.querySelector('.modal-content').appendChild(qrDiv);
        }
    });
});
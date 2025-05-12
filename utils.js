function calcularTotal(cantidades) {
    return (cantidades.vip * 2500) + 
           (cantidades.general * 1500) + 
           (cantidades.balcon * 800);
}

module.exports = { calcularTotal };
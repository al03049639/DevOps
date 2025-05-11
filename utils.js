function calcularTotal(asientos) {
    const precios = { vip: 2500, general: 1500, balcon: 800 };
    return asientos.reduce((total, asiento) => {
        const tipo = asiento.toLowerCase().includes('vip') ? 'vip' 
                 : asiento.includes('G') ? 'general' 
                 : 'balcon';
        return total + precios[tipo];
    }, 0);
}

module.exports = { calcularTotal };
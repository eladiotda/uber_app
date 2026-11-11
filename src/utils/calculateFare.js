import { PRICING } from '../config/pricing.js';
// Función pura (PDF sección 5): la usan la estimación de la solicitud y el cierre del viaje.
// Todo se maneja en pesos enteros para evitar errores de decimales.
export function calculateFare({ distanceKm, durationMin, category, tip = 0 }, pricing = PRICING) {
    const multiplier = pricing.multipliers[category];
    if (multiplier === undefined) throw new Error(`Categoría desconocida: ${category}`);
    const distance = Math.max(0, Number(distanceKm) || 0);
    const minutes = Math.max(0, Number(durationMin) || 0);
    const tipAmount = Math.max(0, Math.round(Number(tip) || 0));
    const subtotal = pricing.baseFare + distance * pricing.perKm + minutes * pricing.perMinute;
    const withMultiplier = Math.max(subtotal * multiplier, pricing.minimumFare);
    // Se redondea al múltiplo de 100 más cercano ANTES de calcular la comisión.
    const fare = Math.round(withMultiplier / pricing.roundTo) * pricing.roundTo;
    const commission = Math.round(fare * pricing.commissionRate);
    // Las propinas van completas al conductor.
    const driverEarnings = fare - commission + tipAmount;
    return { fare, commission, driverEarnings, tip: tipAmount, commissionRate: pricing.commissionRate };
}
// Formato de pesos para mostrar en pantalla: 19200 -> "$19.200".
export function formatCOP(value) {
    const sign = value < 0 ? '-' : '';
    const digits = String(Math.abs(Math.round(value || 0))).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${sign}$${digits}`;
}

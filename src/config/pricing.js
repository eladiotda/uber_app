// Todos los valores de tarifa y comisión en un solo lugar (PDF sección 5).
// Valores didácticos en pesos colombianos enteros (no son tarifas reales).
export const PRICING = {
    baseFare: 3500, // tarifa base
    perKm: 1200, // valor por km
    perMinute: 250, // valor por minuto
    minimumFare: 6000, // tarifa mínima
    roundTo: 100, // la tarifa se redondea al múltiplo de 100 más cercano
    commissionRate: 0.2, // 20 % de comisión de la plataforma
    multipliers: {
        economy: 1.0,
        xl: 1.4,
        premium: 1.8,
    },
};
// Porcentaje legible para mostrar en pantalla (ej. "20 %").
export const COMMISSION_LABEL = `${Math.round(PRICING.commissionRate * 100)} %`;
// Revisión técnico-mecánica: los vehículos con menos de estos años no la necesitan.
// Valor configurable: confírmenlo con el profesor.
export const RTM_EXEMPT_YEARS = 5;

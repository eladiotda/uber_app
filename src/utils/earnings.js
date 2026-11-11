// Cálculos de ganancias e historial. Funciones puras: se prueban sin celular (PDF secciones 5 y 6).
const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const endOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);// Rango de fechas de un filtro: 'today' | 'week' (lunes a domingo) | 'month' | 'range'.
export function periodRange(period, today = new Date(), custom = {}) {
  if (period === 'today') return { from: startOfDay(today), to: endOfDay(today) };
  if (period === 'week') {
    const daysSinceMonday = (today.getDay() + 6) % 7;
    const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - daysSinceMonday);
    const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
    return { from: monday, to: endOfDay(sunday) };
  }
  if (period === 'month') {
    const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return { from: new Date(today.getFullYear(), today.getMonth(), 1), to: endOfDay(last) };
  }
  if (period === 'range') {
    return {
      from: custom.from ? startOfDay(custom.from) : null,
      to: custom.to ? endOfDay(custom.to) : null,
    };
  }
  return { from: null, to: null }; // sin filtro
}
// Fecha que cuenta para las ganancias: cuándo terminó el viaje (o cuándo se creó, si no hay).
function tripDate(trip) {
  const value = trip.completedAt || trip.createdAt;
  if (!value) return null;
  if (value.toDate) return value.toDate();
  return value instanceof Date ? value : new Date(value);
}
export function tripsInRange(trips, { from, to }) {
  return trips.filter((trip) => {
    const date = tripDate(trip);
    return date && (!from || date >= from) && (!to || date <= to);
  });
}
// Resumen de un periodo: número de viajes, facturado, comisiones, propinas, ganancia neta y promedio.export function summarizeTrips(trips) {
  const totals = trips.reduce(
    (acc, trip) => ({
      count: acc.count + 1,
      billed: acc.billed + (trip.fare || 0),
      commissions: acc.commissions + (trip.commission || 0),
      tips: acc.tips + (trip.tip || 0),
      net: acc.net + (trip.driverEarnings || 0),
    }),
    { count: 0, billed: 0, commissions: 0, tips: 0, net: 0 },
  );
  return { ...totals, average: totals.count ? Math.round(totals.net / totals.count) : 0 };
}
// Saldo del conductor: ganancias de viajes pagados por la pasarela
// menos las comisiones de los viajes en efectivo (puede quedar en negativo).
export function driverBalance(trips) {
  return trips
    .filter((trip) => trip.status === 'paid')
    .reduce((balance, trip) => {
      if (trip.paymentMethod === 'cash') return balance - (trip.commission || 0);
      return balance + (trip.driverEarnings || 0);
    }, 0);
}

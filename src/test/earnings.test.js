import { test } from 'node:test';
import assert from 'node:assert/strict';
import { driverBalance, periodRange, summarizeTrips, tripsInRange } from '../utils/earnings.js';
const TODAY = new Date(2026, 10, 12, 15, 0); // jueves 12 de noviembre de 2026
const trips = [
  // Pagado con Mercado Pago hoy
  { status: 'paid', paymentMethod: 'mercadopago', fare: 19200, commission: 3840, tip: 0, driverEarnings: 15360, completedAt: new Date(2026, 10, 12, 9) },
  // Pagado en efectivo el lunes, con propina
  { status: 'paid', paymentMethod: 'cash', fare: 26900, commission: 5380, tip: 2000, driverEarnings: 23520, completedAt: new Date(2026, 10, 9, 18) },
  // Pagado el mes pasado
  { status: 'paid', paymentMethod: 'mercadopago', fare: 6000, commission: 1200, tip: 0, driverEarnings: 4800, completedAt: new Date(2026, 9, 30, 12) },
];
test('rangos: hoy, semana (lunes a domingo) y mes', () => {
  const week = periodRange('week', TODAY);
  assert.equal(week.from.getDate(), 9); // lunes 9
  assert.equal(week.to.getDate(), 15); // domingo 15
  const month = periodRange('month', TODAY);
  assert.equal(month.from.getDate(), 1);
  assert.equal(month.to.getDate(), 30);
  assert.equal(tripsInRange(trips, periodRange('today', TODAY)).length, 1);
  assert.equal(tripsInRange(trips, week).length, 2);
  assert.equal(tripsInRange(trips, month).length, 2);
});
test('resumen de la semana', () => {
  const summary = summarizeTrips(tripsInRange(trips, periodRange('week', TODAY)));
  assert.deepEqual(summary, {
    count: 2,
    billed: 46100,
    commissions: 9220,
    tips: 2000,
    net: 38880,
    average: 19440,
  });
});
test('resumen vacío no divide por cero', () => {
  assert.equal(summarizeTrips([]).average, 0);
});
test('saldo: pasarela suma ganancias y efectivo resta comisión', () => {
  assert.equal(driverBalance(trips), 15360 + 4800 - 5380);
  assert.equal(driverBalance([trips[1]]), -5380); // solo efectivo: queda en negativo
});

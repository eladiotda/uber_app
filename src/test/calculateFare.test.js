import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateFare, formatCOP } from '../utils/calculateFare.js';
test('ejemplo del PDF: 8,5 km y 22 min en Económico', () => {
    const result = calculateFare({ distanceKm: 8.5, durationMin: 22, category: 'economy' });
    assert.equal(result.fare, 19200);
    assert.equal(result.commission, 3840);
    assert.equal(result.driverEarnings, 15360);
});
test('ejemplo del PDF: 8,5 km y 22 min en XL (26.880 se redondea a 26.900)', () => {
    const result = calculateFare({ distanceKm: 8.5, durationMin: 22, category: 'xl' });
    assert.equal(result.fare, 26900);
    assert.equal(result.commission, 5380);
    assert.equal(result.driverEarnings, 21520);
});
test('tarifa mínima de 6.000 COP', () => {
    const result = calculateFare({ distanceKm: 0.5, durationMin: 2, category: 'economy' });
    assert.equal(result.fare, 6000);
    assert.equal(result.commission, 1200);
});
test('la propina va completa al conductor y no paga comisión', () => {
    const result = calculateFare({ distanceKm: 8.5, durationMin: 22, category: 'economy', tip: 2000 });
    assert.equal(result.commission, 3840);
    assert.equal(result.driverEarnings, 15360 + 2000);
});
test('Premium usa el multiplicador 1,8', () => {
    const result = calculateFare({ distanceKm: 8.5, durationMin: 22, category: 'premium' });
    assert.equal(result.fare, 34600); // 19.200 x 1,8 = 34.560 -> 34.600
});
test('categoría desconocida lanza error', () => {
    assert.throws(() => calculateFare({ distanceKm: 1, durationMin: 1, category: 'moto' }));
});
test('formato de pesos colombianos', () => {
    assert.equal(formatCOP(19200), '$19.200');
    assert.equal(formatCOP(-1200), '-$1.200');
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isFutureDate, rtmRequired, validateDocuments } from '../utils/validations.js';
const TODAY = new Date(2026, 10, 10); // 10 de noviembre de 2026
const validDocuments = {
    licenseNumber: '1020304050',
    licenseCategory: 'C1',
    licenseExpiry: '2029-05-01',
    licensePhoto: 'file:///licencia.jpg',
    soatExpiry: '2027-03-15',
    soatPhoto: 'file:///soat.jpg',
    rtmExpiry: '2027-08-20',
    rtmPhoto: 'file:///rtm.jpg',
    mercadoPagoEmail: 'conductor@correo.com',
    termsAccepted: true,
};
test('documentos válidos no tienen errores', () => {
    assert.deepEqual(validateDocuments(validDocuments, '2018', TODAY), {});
});
test('ningún campo puede quedar vacío', () => {
    const errors = validateDocuments({}, '2018', TODAY);
    assert.deepEqual(Object.keys(errors).sort(), [
        'licenseCategory',
        'licenseExpiry',
        'licenseNumber',
        'licensePhoto',
        'mercadoPagoEmail',
        'rtmExpiry',
        'rtmPhoto',
        'soatExpiry',
        'soatPhoto',
        'termsAccepted',
    ]);
});
test('el vencimiento debe ser posterior a hoy (hoy ya no sirve)', () => {
    assert.equal(isFutureDate('2026-11-10', TODAY), false);
    assert.equal(isFutureDate('2026-11-11', TODAY), true);
    assert.ok(validateDocuments({ ...validDocuments, soatExpiry: '2026-11-10' }, '2018', TODAY).soatExpiry);
    assert.ok(validateDocuments({ ...validDocuments, licenseExpiry: '2025-01-01' }, '2018', TODAY).licenseExpiry);
});
test('la revisión técnico-mecánica solo aplica a vehículos de 5 años o más', () => {
    assert.equal(rtmRequired('2023', TODAY), false);
    assert.equal(rtmRequired('2021', TODAY), true);
    const nuevo = { ...validDocuments, rtmExpiry: '', rtmPhoto: '' };
    assert.deepEqual(validateDocuments(nuevo, '2024', TODAY), {});
    assert.ok(validateDocuments(nuevo, '2015', TODAY).rtmPhoto);
});
test('correo de Mercado Pago con formato válido y términos obligatorios', () => {
    assert.ok(validateDocuments({ ...validDocuments, mercadoPagoEmail: 'pagos.correo.com' }, '2018', TODAY).mercadoPagoEmail);
    assert.ok(validateDocuments({ ...validDocuments, termsAccepted: false }, '2018', TODAY).termsAccepted);
});
test('número de licencia: solo dígitos, entre 6 y 12', () => {
    assert.ok(validateDocuments({ ...validDocuments, licenseNumber: '12AB45' }, '2018', TODAY).licenseNumber);
    assert.ok(validateDocuments({ ...validDocuments, licenseNumber: '12345' }, '2018', TODAY).licenseNumber);
});

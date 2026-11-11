import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decodePolyline, simplifyRoute } from '../utils/polyline.js';
test('polilínea de Google se decodifica', () => {
    // Ejemplo oficial de la documentación de Google.
    const points = decodePolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@');
    assert.deepEqual(points, [
        { lat: 38.5, lng: -120.2 },
        { lat: 40.7, lng: -120.95 },
        { lat: 43.252, lng: -126.453 },
    ]);
    assert.equal(simplifyRoute(Array.from({ length: 1000 }, (_, i) => i), 150).length, 150);
});

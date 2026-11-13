import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  NEAR_METERS,
  buildRouteProfile,
  distanceMeters,
  phaseFor,
  positionAt,
  routeKey,
} from '../utils/routeProgress.js';

const A = { lat: 6.25, lng: -75.6 };
const B = { lat: 6.26, lng: -75.6 };
const C = { lat: 6.26, lng: -75.59 };

test('distanceMeters: 0,01° de latitud son unos 1.112 m', () => {
  assert.ok(Math.abs(distanceMeters(A, B) - 1112) < 5);
});

test('buildRouteProfile acumula la distancia de cada tramo', () => {
  const profile = buildRouteProfile([A, B, C]);
  assert.equal(profile.cumulative.length, 3);
  assert.equal(profile.cumulative[0], 0);
  assert.ok(Math.abs(profile.totalMeters - (distanceMeters(A, B) + distanceMeters(B, C))) < 0.001);
});

test('positionAt: inicio, mitad del primer tramo y final', () => {
  const profile = buildRouteProfile([A, B, C]);
  const start = positionAt(profile, 0);
  assert.deepEqual(start.coordinate, A);
  assert.equal(start.phase, 'en_route');

  const middle = positionAt(profile, profile.cumulative[1] / 2);
  assert.equal(middle.index, 0);
  assert.ok(Math.abs(middle.coordinate.lat - 6.255) < 1e-9);

  const end = positionAt(profile, profile.totalMeters + 500); // no se pasa del final
  assert.equal(end.phase, 'arrived');
  assert.equal(end.progress, 1);
  assert.ok(Math.abs(end.coordinate.lng - C.lng) < 1e-9);
});

test('phaseFor: en ruta, próximo a llegar y llegada', () => {
  assert.equal(phaseFor(1000, 5000), 'en_route');
  assert.equal(phaseFor(NEAR_METERS, 5000), 'near');
  assert.equal(phaseFor(0, 5000), 'arrived');
});

test('ruta vacía o de un solo punto: cuenta como llegada', () => {
  assert.equal(positionAt(buildRouteProfile([]), 0).phase, 'arrived');
  assert.equal(positionAt(buildRouteProfile([A]), 0).phase, 'arrived');
});

test('routeKey no cambia si llega el mismo tramo con otros objetos', () => {
  assert.equal(routeKey([A, B]), routeKey([{ ...A }, { ...B }]));
  assert.notEqual(routeKey([A, B]), routeKey([A, C]));
});
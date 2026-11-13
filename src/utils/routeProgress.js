const EARTH_RADIUS_M = 6371000;
export const NEAR_METERS = 300; // "Próximo a llegar" cuando faltan 300 m o menos
const ARRIVED_METERS = 1;

const toRad = (degrees) => (degrees * Math.PI) / 180;
const isPoint = (p) => p && Number.isFinite(p.lat) && Number.isFinite(p.lng);

// Distancia en metros entre dos puntos (fórmula de Haversine).
export function distanceMeters(a, b) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

// Distancia acumulada hasta cada punto: se calcula una vez por ruta.
export function buildRouteProfile(points = []) {
  const clean = (points || []).filter(isPoint);
  const cumulative = clean.length ? [0] : [];
  for (let i = 1; i < clean.length; i += 1) {
    cumulative.push(cumulative[i - 1] + distanceMeters(clean[i - 1], clean[i]));
  }
  return { points: clean, cumulative, totalMeters: cumulative[cumulative.length - 1] || 0 };
}

// Identificador de la ruta: cambia solo si cambia el tramo, no en cada actualización del viaje.
export function routeKey(points = []) {
  const clean = (points || []).filter(isPoint);
  if (!clean.length) return 'empty';
  const fmt = (p) => `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`;
  return `${clean.length}|${fmt(clean[0])}|${fmt(clean[clean.length - 1])}`;
}

// Fase del recorrido según los metros que faltan.
export function phaseFor(remainingMeters, totalMeters) {
  if (totalMeters <= 0 || remainingMeters <= ARRIVED_METERS) return 'arrived';
  if (remainingMeters <= NEAR_METERS) return 'near';
  return 'en_route';
}

// Posición del carro después de recorrer `traveledMeters` sobre la ruta.
export function positionAt(profile, traveledMeters) {
  const { points, cumulative, totalMeters } = profile;
  if (!points.length) {
    return { coordinate: null, index: 0, remainingMeters: 0, progress: 1, phase: 'arrived' };
  }
  if (totalMeters <= 0) {
    return { coordinate: points[points.length - 1], index: points.length - 1, remainingMeters: 0, progress: 1, phase: 'arrived' };
  }
  const traveled = Math.min(Math.max(traveledMeters, 0), totalMeters);
  let i = 0;
  while (i < cumulative.length - 2 && cumulative[i + 1] < traveled) i += 1;
  const segment = cumulative[i + 1] - cumulative[i];
  const t = segment > 0 ? (traveled - cumulative[i]) / segment : 1;
  const a = points[i];
  const b = points[i + 1];
  const remainingMeters = totalMeters - traveled;
  return {
    coordinate: { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t },
    index: i,
    remainingMeters,
    progress: traveled / totalMeters,
    phase: phaseFor(remainingMeters, totalMeters),
  };
}
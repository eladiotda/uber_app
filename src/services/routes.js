// Ruta, distancia y duración entre dos puntos.
// - Si hay EXPO_PUBLIC_GOOGLE_MAPS_API_KEY usa Google Routes API (reemplazo de Directions / Distance Matrix).
// - Si no, usa OSRM (gratis, sin tarjeta; el PDF lo acepta como alternativa).
// IMPORTANTE (PDF sección 7): llamar solo al crear la solicitud y al aceptarla, nunca en cada movimiento.import { decodePolyline, simplifyRoute } from '../utils/polyline';
const GOOGLE_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
async function googleRoute(origin, destination) {
    const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': GOOGLE_KEY,
            'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline',
        },
        body: JSON.stringify({
            origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
            destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
            travelMode: 'DRIVE',
        }),
    });
    const data = await response.json();
    const route = data.routes?.[0];
    if (!response.ok || !route) throw new Error(data.error?.message || 'Google no devolvió una ruta.');
    return {
        distanceKm: route.distanceMeters / 1000,
        durationMin: parseInt(route.duration, 10) / 60, // viene como "1234s"
        points: decodePolyline(route.polyline.encodedPolyline),
    };
}
async function osrmRoute(origin, destination) {
    const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
    const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`,
    );
    const data = await response.json();
    const route = data.routes?.[0];
    if (!response.ok || !route) throw new Error('OSRM no devolvió una ruta.');
    return {
        distanceKm: route.distance / 1000,
        durationMin: route.duration / 60,
        points: route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng })),
    };
}
// Devuelve { distanceKm (1 decimal), durationMin (entero), points: [{ lat, lng }] }.
export async function getRoute(origin, destination) {
    const route = GOOGLE_KEY ? await googleRoute(origin, destination) : await osrmRoute(origin, destination);
    return {
        distanceKm: Math.round(route.distanceKm * 10) / 10,
        durationMin: Math.max(1, Math.round(route.durationMin)),
        points: simplifyRoute(route.points),
    };
}
// Para react-native-maps: { lat, lng } -> { latitude, longitude }.
export const toLatLng = (point) => ({ latitude: point.lat, longitude: point.lng });

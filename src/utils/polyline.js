// Decodifica una polilínea codificada de Google (formato "encoded polyline") a una lista de puntos.
// Función pura: se prueba sin celular.
export function decodePolyline(encoded) {
    const points = [];
    let index = 0;
    let lat = 0;
    let lng = 0;
    while (index < encoded.length) {
        for (const axis of ['lat', 'lng']) {
            let result = 0;
            let shift = 0;
            let byte;
            do {
                byte = encoded.charCodeAt(index++) - 63;
                result |= (byte & 0x1f) << shift;
                shift += 5;
            } while (byte >= 0x20);
            const delta = result & 1 ? ~(result >> 1) : result >> 1;
            if (axis === 'lat') lat += delta;
            else lng += delta;
        }
        points.push({ lat: lat / 1e5, lng: lng / 1e5 });
    }
    return points;
}
// Deja como máximo `max` puntos (para no guardar rutas enormes en Firestore).
export function simplifyRoute(points, max = 150) {
    if (points.length <= max) return points;
    const step = (points.length - 1) / (max - 1);
    return Array.from({ length: max }, (_, i) => points[Math.round(i * step)]);
}

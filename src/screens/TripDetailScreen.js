// Detalle de una carrera (PDF sección 6): ruta dibujada en el mapa con Polyline (sin Static Maps),
// duración, distancia, comisión, propina y calificación del pasajero.
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { toDate, watchTrip } from '../services/tripRepository';
import { toLatLng } from '../services/routes';
import { paymentStatusLabel } from '../services/payments';
import { formatCOP } from '../utils/calculateFare';
import { CATEGORIES } from '../config/catalogs';
import { colors, radius, spacing } from '../theme/colors';
const labelOf = (list, value) => list.find((option) => option.value === value)?.label || value;
function Row({ label, value, strong }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, strong && styles.strong]}>{value}</Text>
    </View>
  );
}
export default function TripDetailScreen({ route }) {
  const { tripId } = route.params;
  const [trip, setTrip] = useState(null);
  useEffect(() => watchTrip(tripId, setTrip), [tripId]);
  if (!trip) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }
  const points = trip.route || [trip.origin, trip.destination];
  const date = toDate(trip.completedAt || trip.createdAt);
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: (trip.origin.lat + trip.destination.lat) / 2,
          longitude: (trip.origin.lng + trip.destination.lng) / 2,
          latitudeDelta: Math.abs(trip.origin.lat - trip.destination.lat) * 1.8 + 0.01,
          longitudeDelta: Math.abs(trip.origin.lng - trip.destination.lng) * 1.8 + 0.01,
        }}
      >
        <Polyline coordinates={points.map(toLatLng)} strokeWidth={4} strokeColor={colors.accent} />
        <Marker coordinate={toLatLng(trip.origin)} title="Origen" pinColor="green" />
        <Marker coordinate={toLatLng(trip.destination)} title="Destino" />
      </MapView>
      <View style={styles.card}>
        <Text style={styles.routeText}>
          {trip.origin.address} → {trip.destination.address}
        </Text>
        <Row label="Fecha" value={date ? date.toLocaleString('es-CO') : '—'} />
        <Row label="Categoría" value={labelOf(CATEGORIES, trip.category)} />
        <Row label="Distancia" value={`${trip.distanceKm} km`} />
        <Row label="Duración" value={`${trip.durationMin} min`} />
      </View>
      <View style={styles.card}>
        <Row label="Tarifa" value={formatCOP(trip.fare || 0)} />
        <Row label={`Comisión (${Math.round((trip.commissionRate || 0) * 100)} %)`} value=
{`-${formatCOP(trip.commission || 0)}`} />
        <Row label="Propina" value={formatCOP(trip.tip || 0)} />
        <Row label="Ganancia neta" value={formatCOP(trip.driverEarnings || 0)} strong />
        <Row label="Pago" value={paymentStatusLabel(trip)} />
        <Row label="Calificación del pasajero" value={trip.rating ? `${'★'.repeat(trip.rating)} (${trip.rating}/5)` : 'Sin calificar'} />
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: spacing, gap: spacing },
  map: { height: 240, borderRadius: radius },
  card: { backgroundColor: colors.surface, borderRadius: radius, padding: spacing, gap: 10 },
  routeText: { fontSize: 16, fontWeight: '700', color: colors.text },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 14, color: colors.muted },
  value: { fontSize: 14, color: colors.text },
  strong: { fontWeight: '700', fontSize: 16 },
});

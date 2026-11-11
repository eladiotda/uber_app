// Historial de carreras (PDF sección 6): FlatList del más reciente al más antiguo, 20 por carga,
// filtros Hoy / Semana / Mes / Rango de fechas y filtro por método de pago.
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRegistration } from '../context/RegistrationContext';
import { fetchTripsPage, toDate } from '../services/tripRepository';
import { paymentStatusLabel } from '../services/payments';
import { periodRange } from '../utils/earnings';
import { parseISODate } from '../utils/validations';
import { formatCOP } from '../utils/calculateFare';
import { CATEGORIES } from '../config/catalogs';
import { Banner, DateField } from '../components/FormControls';
import { colors, radius, spacing } from '../theme/colors';
const PERIODS = [
  { value: 'all', label: 'Todo' },
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
  { value: 'range', label: 'Rango' },
];
const METHODS = [
  { value: '', label: 'Todos' },
  { value: 'mercadopago', label: 'Mercado Pago' },
  { value: 'cash', label: 'Efectivo' },
];
const TRIP_STATUS = { cancelled: 'Cancelado', completed: 'Por cobrar', paid: 'Pagado' };
const labelOf = (list, value) => list.find((option) => option.value === value)?.label || value;
function Chips({ options, value, onChange }) {
  return (
    <View style={styles.chips}>
      {options.map((option) => (
        <Pressable
          key={option.value || 'all'}
          onPress={() => onChange(option.value)}
          style={[styles.chip, value === option.value && styles.chipActive]}
        >
          <Text style={[styles.chipText, value === option.value && styles.chipTextActive]}>{option.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}
function TripItem({ trip, onPress }) {
  const date = toDate(trip.completedAt || trip.createdAt);
  return (
    <Pressable onPress={onPress} style={styles.item}>
      <View style={styles.itemHeader}>
        <Text style={styles.date}>{date ? date.toLocaleString('es-CO') : '—'}</Text>
        <Text style={styles.status}>{TRIP_STATUS[trip.status] || trip.status}</Text>
      </View>
      <Text style={styles.route} numberOfLines={2}>
        {trip.origin?.address} → {trip.destination?.address}
      </Text>
      <View style={styles.itemFooter}>
        <Text style={styles.detail}>{labelOf(CATEGORIES, trip.category)}</Text>
        <Text style={styles.detail}>Tarifa {formatCOP(trip.fare || trip.estimatedFare)}</Text>
        <Text style={styles.net}>Neto {formatCOP(trip.driverEarnings || 0)}</Text>
      </View>
      <Text style={styles.detail}>Pago: {paymentStatusLabel(trip)}</Text>
    </Pressable>
  );
}
export default function HistoryScreen({ navigation }) {
  const { driverId } = useRegistration();
  const [period, setPeriod] = useState('all');
  const [method, setMethod] = useState('');
  const [range, setRange] = useState({ from: '', to: '' });
  const [trips, setTrips] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(
    async (after = null) => {
      if (!driverId) return;
      const { from, to } = periodRange(period, new Date(), {
        from: parseISODate(range.from),
        to: parseISODate(range.to),
      });
      setLoading(true);
      setError('');
      try {
        const page = await fetchTripsPage(driverId, { from, to, paymentMethod: method || undefined, after });
        // Las solicitudes rechazadas no son carreras: no se muestran.
        const visible = page.trips.filter((trip) => trip.status !== 'rejected');
        setTrips((current) => (after ? [...current, ...visible] : visible));
        setCursor(page.cursor);
        setHasMore(page.hasMore);
      } catch (loadError) {
        // Si falta un índice, Firestore muestra en este mensaje el enlace para crearlo.
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    },
    [driverId, period, method, range],
  );
  // Cada vez que cambia un filtro se recarga desde la primera página.
  useEffect(() => {
    if (period === 'range' && (!range.from || !range.to)) return;
    load();
  }, [load, period, range]);
  return (
    <FlatList
      data={trips}
      keyExtractor={(trip) => trip.id}
      contentContainerStyle={styles.container}
      ListHeaderComponent={
        <View style={styles.filters}>
          <Chips options={PERIODS} value={period} onChange={setPeriod} />
          {period === 'range' ? (
            <View style={styles.rangeRow}>
              <View style={{ flex: 1 }}>
                <DateField label="Desde" value={range.from} onChange={(from) => setRange((r) => ({ ...r, from }))} maximumDate={new Date()} />
              </View>
              <View style={{ flex: 1 }}>
                <DateField label="Hasta" value={range.to} onChange={(to) => setRange((r) => ({ ...r, to }))} maximumDate={new Date()} />
              </View>
            </View>
          ) : null}
          <Chips options={METHODS} value={method} onChange={setMethod} />
          {error ? <Banner tone="danger">{error}</Banner> : null}
        </View>
      }
      renderItem={({ item }) => (
        <TripItem trip={item} onPress={() => navigation.navigate('TripDetail', { tripId: item.id })} />
      )}
      ListEmptyComponent={
        loading ? null : <Text style={styles.empty}>No tienes viajes en este filtro.</Text>
      }
      ListFooterComponent={
        loading ? (
          <ActivityIndicator color={colors.accent} style={{ margin: spacing }} />
        ) : hasMore ? (
          <Pressable onPress={() => load(cursor)} style={styles.more}>
            <Text style={styles.moreText}>Cargar más</Text>
          </Pressable>
        ) : null
      }
    />
  );
}
const styles = StyleSheet.create({
  container: { padding: spacing, gap: 10 },
  filters: { gap: 10, marginBottom: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  rangeRow: { flexDirection: 'row', gap: 10 },
  item: { backgroundColor: colors.surface, borderRadius: radius, padding: spacing, gap: 6 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  date: { fontSize: 13, color: colors.muted },
  status: { fontSize: 13, fontWeight: '700', color: colors.accent },
  route: { fontSize: 15, fontWeight: '600', color: colors.text },
  itemFooter: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  detail: { fontSize: 13, color: colors.muted },
  net: { fontSize: 13, fontWeight: '700', color: colors.text },
  empty: { textAlign: 'center', color: colors.muted, marginTop: spacing * 2 },
  more: { alignItems: 'center', padding: spacing },
  moreText: { color: colors.primary, fontWeight: '700' },
});

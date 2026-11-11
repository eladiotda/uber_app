import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { markCashPaid, watchTrip } from '../services/tripRepository';
import { isBackendConfigured, openCheckout, paymentStatusLabel } from '../services/payments';
import { formatCOP } from '../utils/calculateFare';
import { Banner, Button } from '../components/FormControls';
import { colors, radius, spacing } from '../theme/colors';
const STATUS_COLORS = {
  Aprobado: colors.accent,
  Efectivo: colors.accent,
  Rechazado: colors.danger,
};
function Row({ label, value, strong }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.label, strong && styles.strong]}>{label}</Text>
      <Text style={[styles.value, strong && styles.strong]}>{value}</Text>
    </View>
  );
}
export default function PaymentSummaryScreen({ navigation, route }) {
  const { tripId } = route.params;
  const [trip, setTrip] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  // La pasarela actualiza el viaje desde el backend; aquí se escucha el cambio en tiempo real.
  useEffect(() => watchTrip(tripId, setTrip, (watchError) => setError(watchError.message)), [tripId]);
  const run = async (action) => {
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setBusy(false);
    }
  };
  if (!trip) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }
  const paid = trip.status === 'paid';
  const status = paymentStatusLabel(trip);
  const isCash = trip.paymentMethod === 'cash';
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{paid ? 'Viaje pagado' : 'Cobro del viaje'}</Text>
        <View style={styles.card}>
          <Row label="Tarifa final" value={formatCOP(trip.fare)} />
          <Row label={`Comisión (${Math.round((trip.commissionRate || 0) * 100)} %)`} value=
{`-${formatCOP(trip.commission)}`} />
          <Row label="Propina" value={formatCOP(trip.tip || 0)} />
          <Row label="Tu ganancia neta" value={formatCOP(trip.driverEarnings)} strong />
        </View>
        <View style={styles.card}>
          <Row label="Método de pago" value={isCash ? 'Efectivo' : 'Mercado Pago'} />
          <View style={styles.row}>
            <Text style={styles.label}>Estado del pago</Text>
            <Text style={[styles.badge, { color: STATUS_COLORS[status] || colors.muted }]}>{status}</Text>
          </View>
        </View>
        {isCash && !paid ? (
          <Banner tone="info">
            Pago en efectivo: la comisión de {formatCOP(trip.commission)} se descuenta de tu saldo.
          </Banner>
        ) : null}
        {!isCash && !paid && !isBackendConfigured ? (
          <Banner tone="warning">Configura EXPO_PUBLIC_BACKEND_URL en el .env para cobrar con Mercado Pago.</Banner>
        ) : null}
        {error ? <Banner tone="danger">{error}</Banner> : null}
        {paid ? (
          <Button title="Volver al inicio" onPress={() => navigation.popToTop()} />
        ) : isCash ? (
          <Button title="Cobro recibido" onPress={() => run(() => markCashPaid(tripId))} loading={busy} disabled={busy} />
        ) : (
          <>
            <Button
              title={trip.paymentStatus === 'rejected' ? 'Intentar de nuevo' : 'Cobrar con Mercado Pago'}
              onPress={() => run(() => openCheckout(tripId))}
              loading={busy}
              disabled={busy || !isBackendConfigured}
            />
            <Text style={styles.hint}>
              El pasajero paga con una tarjeta de prueba. El estado se actualiza solo cuando la pasarela confirma.
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: spacing, gap: 4 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 12 },
  card: { backgroundColor: colors.surface, borderRadius: radius, padding: spacing, gap: 10, marginBottom: spacing },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 15, color: colors.muted },
  value: { fontSize: 15, color: colors.text },
  strong: { fontWeight: '700', color: colors.text, fontSize: 17 },
  badge: { fontSize: 15, fontWeight: '700' },
  hint: { fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 8 },
});
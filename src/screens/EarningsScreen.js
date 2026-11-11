// Ganancias (PDF sección 5): para hoy, la semana y el mes, más el saldo del conductor.
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRegistration } from '../context/RegistrationContext';
import { useEarnings } from '../hooks/useEarnings';
import { formatCOP } from '../utils/calculateFare';
import { Banner } from '../components/FormControls';
import { colors, radius, spacing } from '../theme/colors';
const PERIODS = [
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
];
function Row({ label, value, strong }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.label, strong && styles.strong]}>{label}</Text>
      <Text style={[styles.value, strong && styles.strong]}>{value}</Text>
    </View>
  );
}
export default function EarningsScreen() {
  const { driverId } = useRegistration();
  const { summaries, balance, loading, error } = useEarnings(driverId);
  const [period, setPeriod] = useState('today');
  const summary = summaries[period];
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={[styles.card, styles.balanceCard]}>
        <Text style={styles.balanceLabel}>Tu saldo</Text>
        <Text style={[styles.balance, balance < 0 && { color: colors.danger }]}>{formatCOP(balance)}
</Text>
        <Text style={styles.hint}>
          Ganancias de viajes pagados por Mercado Pago menos comisiones de viajes en efectivo.
        </Text>
      </View>
      <View style={styles.tabs}>
        {PERIODS.map((option) => (
          <Pressable
            key={option.value}
            onPress={() => setPeriod(option.value)}
            style={[styles.tab, period === option.value && styles.tabActive]}
          >
            <Text style={[styles.tabText, period === option.value && styles.tabTextActive]}>{option.label}</Text>
          </Pressable>
        ))}
      </View>
      {error ? <Banner tone="danger">{error}</Banner> : null}
      {loading ? (
        <ActivityIndicator color={colors.accent} />
      ) : (
        <View style={styles.card}>
          <Row label="Viajes" value={String(summary.count)} />
          <Row label="Total facturado" value={formatCOP(summary.billed)} />
          <Row label="Comisiones" value={`-${formatCOP(summary.commissions)}`} />
          <Row label="Propinas" value={formatCOP(summary.tips)} />
          <Row label="Ganancia neta" value={formatCOP(summary.net)} strong />
          <Row label="Promedio por viaje" value={formatCOP(summary.average)} />
        </View>
      )}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { padding: spacing, gap: spacing },
  card: { backgroundColor: colors.surface, borderRadius: radius, padding: spacing, gap: 10 },
  balanceCard: { alignItems: 'center', gap: 4 },
  balanceLabel: { fontSize: 14, color: colors.muted },
  balance: { fontSize: 34, fontWeight: '800', color: colors.accent },
  hint: { fontSize: 12, color: colors.muted, textAlign: 'center' },
  tabs: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: radius - 4, alignItems: 'center' },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontWeight: '600', color: colors.muted },
  tabTextActive: { color: '#fff' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 15, color: colors.muted },
  value: { fontSize: 15, color: colors.text },
  strong: { fontWeight: '700', color: colors.text, fontSize: 17 },
});

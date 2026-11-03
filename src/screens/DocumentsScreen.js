import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRegistration } from '../context/RegistrationContext';
import { hasErrors } from '../utils/validations';
import { Banner } from '../components/FormControls';
import { colors, radius, spacing } from '../theme/colors';

function StepRow({ title, errors }) {
  const pending = Object.keys(errors).length;
  return (
    <View style={styles.row}>
      <Text style={styles.rowTitle}>{title}</Text>
      <Text style={[styles.rowStatus, { color: pending ? colors.danger : colors.accent }]}>
        {pending ? `${pending} campo(s) pendiente(s)` : '✓ Completa'}
      </Text>
    </View>
  );
}

export default function DocumentsScreen() {
  const { errors } = useRegistration();
  const ready = !hasErrors(errors.personal) && !hasErrors(errors.vehicle);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Avance del registro</Text>
      <View style={styles.card}>
        <StepRow title="1. Datos personales" errors={errors.personal} />
        <StepRow title="2. Vehículo" errors={errors.vehicle} />
      </View>
      <Banner tone={ready ? 'success' : 'info'}>
        {ready
          ? 'Las pestañas 1 y 2 están completas y válidas.'
          : 'Completa las pestañas 1 y 2. Los errores se muestran debajo de cada campo.'}
      </Banner>
      <Banner tone="warning">
        Pestaña 3 · Documentos y pagos (licencia, SOAT, revisión técnico-mecánica, correo de Mercado
        Pago y términos): se implementa en la segunda entrega.
      </Banner>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing, gap: 4 },
  title: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 8 },
  card: { backgroundColor: colors.surface, borderRadius: radius, padding: spacing, marginBottom: spacing, gap: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  rowTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  rowStatus: { fontSize: 14, fontWeight: '600' },
});

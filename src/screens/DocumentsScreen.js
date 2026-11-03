import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRegistration } from '../context/RegistrationContext';
import { hasErrors } from '../utils/validations';
import { Banner } from '../components/FormControls';
import { colors, radius, spacing } from '../theme/colors';

const STATUS_LABELS = { draft: 'Borrador (draft)', pending: 'En revisión', approved: 'Aprobado' };

// Firestore devuelve Timestamp al cargar; al guardar desde la app es un Date.
function formatDate(value) {
  const date = value?.toDate ? value.toDate() : value instanceof Date ? value : null;
  return date ? date.toLocaleString('es-CO') : '—';
}

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
  const { errors, record, personal, vehicle } = useRegistration();
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

      <Text style={styles.title}>Guardado en la base de datos</Text>
      {record ? (
        <View style={styles.card}>
          <Banner tone="success">Datos y fotos guardados en Firestore.</Banner>
          <View style={styles.photos}>
            {personal.photo ? <Image source={{ uri: personal.photo }} style={styles.avatar} /> : null}
            {vehicle.photo ? <Image source={{ uri: vehicle.photo }} style={styles.car} /> : null}
          </View>
          <Text style={styles.detailStrong}>{record.personal?.fullName}</Text>
          <Text style={styles.detail}>Placa: {record.vehicle?.plate}</Text>
          <Text style={styles.detail}>Estado: {STATUS_LABELS[record.status] || record.status}</Text>
          <Text style={styles.detail}>Última actualización: {formatDate(record.updatedAt)}</Text>
        </View>
      ) : (
        <Banner tone="info">Aún no has guardado. Completa las pestañas y toca "Guardar registro" en Vehículo.</Banner>
      )}

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
  photos: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.border },
  car: { width: 130, height: 90, borderRadius: radius, backgroundColor: colors.border },
  detailStrong: { fontSize: 16, fontWeight: '700', color: colors.text },
  detail: { fontSize: 14, color: colors.muted },
});
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components/FormControls';
import { colors, radius, spacing } from '../theme/colors';

const BENEFITS = [
  { icon: 'car-outline', title: 'Recibe viajes', text: 'Activa tu disponibilidad y acepta solicitudes cerca de ti.' },
  { icon: 'card-outline', title: 'Cobra fácil', text: 'Pagos con Mercado Pago o en efectivo, al terminar cada viaje.' },
  { icon: 'stats-chart-outline', title: 'Controla tus ganancias', text: 'Consulta lo que ganas por día, semana y mes.' },
];

const REQUIREMENTS = [
  { icon: 'person-outline', text: 'Ser mayor de 18 años' },
  { icon: 'id-card-outline', text: 'Licencia de conducción vigente' },
  { icon: 'document-text-outline', text: 'SOAT vigente y revisión técnico-mecánica (si aplica)' },
  { icon: 'camera-outline', text: 'Fotos de tu vehículo con la placa visible' },
];

export default function WelcomeScreen({ hasDraft, onStart }) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Image source={require('../../assets/icon.png')} style={styles.logo} />
        <Text style={styles.title}>Bienvenido a UberClone Conductor</Text>
        <Text style={styles.subtitle}>Conduce, gana dinero y maneja tu propio tiempo.</Text>
      </View>

      <View style={styles.card}>
        {BENEFITS.map((item) => (
          <View key={item.title} style={styles.row}>
            <View style={styles.iconCircle}>
              <Ionicons name={item.icon} size={22} color={colors.accent} />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>{item.title}</Text>
              <Text style={styles.rowText}>{item.text}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Qué necesitas para registrarte</Text>
        {REQUIREMENTS.map((item) => (
          <View key={item.text} style={styles.requirement}>
            <Ionicons name={item.icon} size={18} color={colors.accent} />
            <Text style={styles.requirementText}>{item.text}</Text>
          </View>
        ))}
        <View style={styles.note}>
          <Ionicons name="information-circle-outline" size={18} color={colors.muted} />
          <Text style={styles.noteText}>
            Después de enviar tu registro, revisaremos tus datos. Podrás recibir viajes cuando tu cuenta sea aprobada.
          </Text>
        </View>
      </View>

      <Button title={hasDraft ? 'Continuar mi registro' : 'Registrarme como conductor'} onPress={onStart} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing,
    paddingTop: spacing * 3,
    paddingBottom: spacing * 2,
    gap: spacing,
    backgroundColor: colors.background,
    flexGrow: 1,
  },
  hero: { alignItems: 'center', gap: 8, marginBottom: 4 },
  logo: { width: 96, height: 96, borderRadius: 24 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, textAlign: 'center' },
  subtitle: { fontSize: 15, color: colors.muted, textAlign: 'center' },
  card: { backgroundColor: colors.surface, borderRadius: radius, padding: spacing, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1 },
  rowTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  rowText: { fontSize: 14, color: colors.muted },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  requirement: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  requirementText: { flex: 1, fontSize: 14, color: colors.text },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 4 },
  noteText: { flex: 1, fontSize: 13, color: colors.muted },
});
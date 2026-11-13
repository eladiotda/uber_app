import { useCallback, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRegistration } from '../context/RegistrationContext';
import { Banner, Button } from '../components/FormControls';
import { requestDevApproval } from '../services/devApproval';
import { colors, radius, spacing } from '../theme/colors';
// Cuenta enviada y Pendiente de aprobación (PDF sección 2).
// Para simular la aprobación: botón "Aprobar cuenta" (solo en desarrollo, vía backend)
// o en Firestore -> drivers/{uid} -> cambiar status a "approved".
// La app lo detecta en tiempo real (watchDriver) y abre la pantalla de Inicio.
export default function PendingScreen() {
  const { record, personal, vehicle, driverId } = useRegistration();
  const [approving, setApproving] = useState(false);
  const [approveError, setApproveError] = useState('');

  // AI-assisted: see docs/AI_LOG.md #N
  const handleApprove = useCallback(async () => {
    setApproving(true);
    setApproveError('');
    try {
      await requestDevApproval();
      // No se navega a mano: watchDriver ve status "approved" y cambia de pantalla.
    } catch (error) {
      setApproveError(error.message);
    } finally {
      setApproving(false);
    }
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Pendiente de aprobación</Text>
      <Banner tone="info">
        Recibimos tu registro. Mientras lo revisamos no puedes ponerte Disponible. Te avisaremos cuando tu cuenta sea
        aprobada.
      </Banner>
      <View style={styles.card}>
        <View style={styles.photos}>
          {personal.photo ? <Image source={{ uri: personal.photo }} style={styles.avatar} /> : null}
          {vehicle.photo ? <Image source={{ uri: vehicle.photo }} style={styles.car} /> : null}
        </View>
        <Text style={styles.strong}>{record?.personal?.fullName}</Text>
        <Text style={styles.detail}>
          {record?.vehicle?.brand} {record?.vehicle?.model} · {record?.vehicle?.plate}
        </Text>
      </View>
      {__DEV__ ? (
        <View style={styles.devBox}>
          <Banner tone="warning">
            Modo pruebas: aprueba la cuenta con el botón, o en la consola de Firebase abre drivers/{driverId} y cambia
            status a "approved".
          </Banner>
          <Button title="Aprobar cuenta (pruebas)" onPress={handleApprove} loading={approving} />
          {approveError ? <Text style={styles.error}>{approveError}</Text> : null}
        </View>
      ) : null}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { padding: spacing, paddingTop: spacing * 4, gap: 4, backgroundColor: colors.background, flexGrow: 1 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 12 },
  card: { backgroundColor: colors.surface, borderRadius: radius, padding: spacing, marginBottom: spacing, gap: 8 },
  photos: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.border },
  car: { width: 130, height: 90, borderRadius: radius, backgroundColor: colors.border },
  strong: { fontSize: 16, fontWeight: '700', color: colors.text },
  detail: { fontSize: 14, color: colors.muted },
  devBox: { gap: 8 },
  error: { fontSize: 13, color: colors.danger },
});
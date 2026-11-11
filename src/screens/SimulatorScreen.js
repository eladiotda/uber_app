import { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useRegistration } from '../context/RegistrationContext';
import { createTestTrip } from '../services/tripRepository';
import { getRoute } from '../services/routes';
import { CATEGORIES, PAYMENT_METHODS } from '../config/catalogs';
import { Banner, Button, SelectField } from '../components/FormControls';
import { calculateFare, formatCOP } from '../utils/calculateFare';
import { colors, spacing } from '../theme/colors';
// Lugares de Medellín para las pruebas (coordenadas aproximadas).
export const TEST_PLACES = [
  { value: 'lleras', label: 'Parque Lleras', lat: 6.2088, lng: -75.5677 },
  { value: 'botero', label: 'Plaza Botero', lat: 6.2518, lng: -75.5686 },
  { value: 'estadio', label: 'Estadio Atanasio Girardot', lat: 6.2566, lng: -75.5903 },
  { value: 'olaya', label: 'Aeropuerto Olaya Herrera', lat: 6.2196, lng: -75.5906 },
  { value: 'tesoro', label: 'C.C. El Tesoro', lat: 6.1975, lng: -75.5586 },
  { value: 'nutibara', label: 'Pueblito Paisa', lat: 6.2364, lng: -75.5803 },
  { value: 'udea', label: 'Universidad de Antioquia', lat: 6.2675, lng: -75.5689 },
];
const TIPS = [
  { value: '0', label: 'Sin propina' },
  { value: '1000', label: '$1.000' },
  { value: '2000', label: '$2.000' },
  { value: '5000', label: '$5.000' },
];
const toPlace = (value) => {
  const place = TEST_PLACES.find((option) => option.value === value);
  return { lat: place.lat, lng: place.lng, address: place.label };
};
export default function SimulatorScreen() {
  const { record } = useRegistration();
  const [form, setForm] = useState({
    origin: 'lleras',
    destination: 'estadio',
    category: record?.vehicle?.category || 'economy',
    paymentMethod: 'cash',
    tip: '0',
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null); // { tone, text }
  const set = (field) => (value) => setForm((current) => ({ ...current, [field]: value }));
  const create = async () => {
    if (form.origin === form.destination) {
      setMessage({ tone: 'danger', text: 'El origen y el destino deben ser distintos.' });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const origin = toPlace(form.origin);
      const destination = toPlace(form.destination);
      const route = await getRoute(origin, destination);
      const tip = Number(form.tip);
      await createTestTrip({
        origin,
        destination,
        route,
        category: form.category,
        paymentMethod: form.paymentMethod,
        tip,
        rating: 3 + Math.floor(Math.random() * 3), // calificación simulada del pasajero (3 a 5)
      });
      const fare = calculateFare({ ...route, category: form.category, tip });
      setMessage({
        tone: 'success',
        text: `Solicitud creada: ${route.distanceKm} km, ${route.durationMin} min, tarifa ${formatCOP(fare.fare)}. Ve a Inicio y ponte Disponible.`,
      });
    } catch (error) {
      setMessage({ tone: 'danger', text: error.message });
    } finally {
      setBusy(false);
    }
  };
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Simular solicitud de pasajero</Text>
      <Banner tone="info">
        Solo para pruebas. La solicitud llega a los conductores Disponibles de la misma categoría.
      </Banner>
      <SelectField label="Origen" value={form.origin} options={TEST_PLACES} onChange={set('origin')} />
      <SelectField label="Destino" value={form.destination} options={TEST_PLACES} onChange=
{set('destination')} />
      <SelectField label="Categoría" value={form.category} options={CATEGORIES} onChange={set('category')} />
      <SelectField label="Método de pago" value={form.paymentMethod} options={PAYMENT_METHODS} onChange={set('paymentMethod')} />
      <SelectField label="Propina" value={form.tip} options={TIPS} onChange={set('tip')} />
      {message ? <Banner tone={message.tone}>{message.text}</Banner> : null}
      <Button title="Crear solicitud" onPress={create} loading={busy} disabled={busy} />
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { padding: spacing, paddingBottom: spacing * 3 },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 12 },
});
 
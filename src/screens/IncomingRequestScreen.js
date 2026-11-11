// Solicitud entrante (PDF sección 3): tarjeta con el detalle y temporizador de 15 segundos.
// Si llega a cero, la solicitud se rechaza automáticamente.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRegistration } from "../context/RegistrationContext";
import { acceptTrip, rejectTrip } from "../services/tripRepository";
import { getRoute } from "../services/routes";
import { calculateFare, formatCOP } from "../utils/calculateFare";
import { CATEGORIES, PAYMENT_METHODS } from "../config/catalogs";
import { Banner, Button } from "../components/FormControls";
import { colors, radius, spacing } from "../theme/colors";
const TIME_LIMIT = 15; // segundos para aceptar
const labelOf = (list, value) =>
  list.find((option) => option.value === value)?.label || value;
function Row({ label, value, strong }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, strong && styles.strong]}>{value}</Text>
    </View>
  );
}
export default function IncomingRequestScreen({ navigation, route }) {
  const { trip, driverLocation } = route.params;
  const { driverId } = useRegistration();
  const [secondsLeft, setSecondsLeft] = useState(TIME_LIMIT);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const answered = useRef(false); // evita aceptar y rechazar la misma solicitud dos veces
  // Ganancia neta estimada con la MISMA función que se usa al cerrar el viaje.
  const estimate = useMemo(
    () =>
      calculateFare({
        distanceKm: trip.distanceKm,
        durationMin: trip.durationMin,
        category: trip.category,
        tip: trip.tip || 0,
      }),
    [trip],
  );
  const reject = useCallback(
    async (reason) => {
      if (answered.current) return;
      answered.current = true;
      try {
        await rejectTrip(trip.id, driverId, reason);
      } catch {
        // Si otro conductor la tomó, no hay nada que rechazar.
      }
      navigation.goBack();
    },
    [driverId, navigation, trip.id],
  );
  const accept = useCallback(async () => {
    if (answered.current) return;
    answered.current = true;
    setBusy(true);
    setError("");
    try {
      // Ruta al punto de recogida: se calcula UNA sola vez, al aceptar (PDF sección 7).
      const pickup = driverLocation
        ? await getRoute(driverLocation, trip.origin).catch(() => null)
        : null;
      await acceptTrip(trip.id, driverId, pickup);
      navigation.replace("TripInProgress", { tripId: trip.id });
    } catch (acceptError) {
      setError(acceptError.message);
      setBusy(false);
      setTimeout(() => navigation.goBack(), 1500);
    }
  }, [driverId, driverLocation, navigation, trip]);
  // Temporizador: baja un segundo a la vez; la limpieza borra el intervalo al salir de la pantalla.
  useEffect(() => {
    const interval = setInterval(
      () => setSecondsLeft((current) => Math.max(0, current - 1)),
      1000,
    );
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    if (secondsLeft === 0) reject("timeout");
  }, [secondsLeft, reject]);
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.timer}>
          <Text
            style={[
              styles.timerText,
              secondsLeft <= 5 && { color: colors.danger },
            ]}
          >
            {secondsLeft}s
          </Text>
          <View style={styles.track}>
            <View
              style={[
                styles.bar,
                { width: `${(secondsLeft / TIME_LIMIT) * 100}%` },
              ]}
            />
          </View>
        </View>
        <Text style={styles.title}>Nueva solicitud de viaje</Text>
        <View style={styles.card}>
          <Row label="Origen" value={trip.origin?.address} />
          <Row label="Destino" value={trip.destination?.address} />
          <Row label="Distancia" value={`${trip.distanceKm} km`} />
          <Row label="Duración" value={`${trip.durationMin} min`} />
          <Row label="Categoría" value={labelOf(CATEGORIES, trip.category)} />
          <Row
            label="Método de pago"
            value={labelOf(PAYMENT_METHODS, trip.paymentMethod)}
          />
          <Row label="Tarifa estimada" value={formatCOP(estimate.fare)} />
          <Row
            label="Tu ganancia neta estimada"
            value={formatCOP(estimate.driverEarnings)}
            strong
          />
        </View>
        {error ? <Banner tone="danger">{error}</Banner> : null}
        <Button
          title="Aceptar"
          onPress={accept}
          loading={busy}
          disabled={busy}
        />
        <Button
          title="Rechazar"
          kind="secondary"
          onPress={() => reject("manual")}
          disabled={busy}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing, gap: 4 },
  timer: { alignItems: "center", gap: 8, marginBottom: spacing },
  timerText: { fontSize: 40, fontWeight: "800", color: colors.text },
  track: {
    width: "100%",
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    overflow: "hidden",
  },
  bar: { height: 8, backgroundColor: colors.accent },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius,
    padding: spacing,
    gap: 10,
    marginBottom: spacing,
  },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  label: { fontSize: 14, color: colors.muted },
  value: {
    fontSize: 15,
    color: colors.text,
    flexShrink: 1,
    textAlign: "right",
  },
  strong: { fontWeight: "700", color: colors.accent, fontSize: 17 },
});

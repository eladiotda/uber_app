import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import {
  cancelTrip,
  completeTrip,
  markDriverArriving,
  markPassengerOnBoard,
  watchTrip,
} from "../services/tripRepository";
import { toLatLng } from "../services/routes";
import { useRouteSimulation } from "../hooks/useRouteSimulation";
import { Banner, Button } from "../components/FormControls";
import { colors, radius, spacing } from "../theme/colors";

const SPEEDS = [1, 2, 4];
const MESSAGES = {
  pickup: {
    en_route: "En camino al punto de recogida",
    near: "Próximo a llegar",
    arrived: "¡Hemos llegado! Espera al pasajero",
  },
  destination: {
    en_route: "Rumbo al destino",
    near: "Próximo a llegar al destino",
    arrived: "¡Hemos llegado al destino!",
  },
};
const PHASE_ICON = { en_route: "navigate-outline", near: "time-outline", arrived: "checkmark-circle" };
const FIT_PADDING = { top: 60, right: 40, bottom: 60, left: 40 };

// Encuadra el mapa para que se vea toda la ruta.
function regionFor(points) {
  if (!points?.length) return undefined;
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(0.01, (maxLat - minLat) * 1.5),
    longitudeDelta: Math.max(0.01, (maxLng - minLng) * 1.5),
  };
}

// Comprime el tramo real a 12–30 segundos para la demostración.
function demoSecondsFor(minutes) {
  return Math.min(30, Math.max(12, Math.round((minutes || 8) * 1.5)));
}

export default function TripInProgressScreen({ navigation, route }) {
  const { tripId } = route.params;
  const [trip, setTrip] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [speed, setSpeed] = useState(1);
  const [carTracks, setCarTracks] = useState(true);
  const arrivingSent = useRef(false);
  const mapRef = useRef(null);

  // Escucha el viaje en tiempo real; la limpieza deja de escuchar al salir.
  useEffect(
    () => watchTrip(tripId, setTrip, (watchError) => setError(watchError.message)),
    [tripId],
  );

  // accepted -> driver_arriving: el conductor sale hacia el punto de recogida.
  useEffect(() => {
    if (trip?.status === "accepted" && !arrivingSent.current) {
      arrivingSent.current = true;
      markDriverArriving(tripId).catch((updateError) => setError(updateError.message));
    }
    if (trip?.status === "completed") navigation.replace("PaymentSummary", { tripId });
    if (trip?.status === "cancelled") navigation.popToTop();
  }, [trip?.status, tripId, navigation]);

  const onBoard = trip?.status === "in_progress";
  const leg = onBoard ? "destination" : "pickup";

  // Antes de recoger: ruta conductor -> origen. Después: ruta guardada origen -> destino.
  const points = useMemo(() => {
    if (!trip) return [];
    if (onBoard) return trip.route || [];
    return trip.pickup?.points || [trip.origin];
  }, [trip, onBoard]);
  const target = onBoard ? trip?.destination : trip?.origin;
  const legMinutes = onBoard ? trip?.durationMin : trip?.pickup?.durationMin;

  const sim = useRouteSimulation(points, { durationSec: demoSecondsFor(legMinutes), speed });
  const hasCar = Boolean(sim.coordinate);

  // Al cambiar de tramo (recogida -> destino) se encuadra la ruta completa.
  useEffect(() => {
    if (!mapRef.current || points.length < 2) return;
    mapRef.current.fitToCoordinates(points.map(toLatLng), { edgePadding: FIT_PADDING, animated: true });
  }, [sim.routeId]); // eslint-disable-line react-hooks/exhaustive-deps

  // El ícono se dibuja una vez; después solo cambia su posición (mejor rendimiento en Android).
  useEffect(() => {
    if (!hasCar) return undefined;
    setCarTracks(true);
    const timer = setTimeout(() => setCarTracks(false), 1500);
    return () => clearTimeout(timer);
  }, [hasCar, sim.routeId]);

  // Ruta partida en dos: lo recorrido (gris) y lo que falta (verde).
  const traveledLine = useMemo(() => {
    if (!sim.coordinate || points.length < 2) return [];
    return [...points.slice(0, sim.index + 1), sim.coordinate].map(toLatLng);
  }, [points, sim.index, sim.coordinate]);
  const remainingLine = useMemo(() => {
    if (!sim.coordinate || points.length < 2) return [];
    return [sim.coordinate, ...points.slice(sim.index + 1)].map(toLatLng);
  }, [points, sim.index, sim.coordinate]);

  const run = async (action) => {
    setBusy(true);
    setError("");
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

  const arrived = sim.phase === "arrived";
  const remainingKm = (sim.remainingMeters / 1000).toFixed(1);
  const remainingMin = legMinutes ? Math.max(0, Math.ceil(legMinutes * (1 - sim.progress))) : null;
  const phaseColor = arrived ? colors.accent : sim.phase === "near" ? "#B45309" : colors.accent;

  return (
    <View style={styles.container}>
      <MapView ref={mapRef} style={styles.map} initialRegion={regionFor(points)} showsUserLocation>
        {traveledLine.length > 1 ? (
          <Polyline coordinates={traveledLine} strokeWidth={5} strokeColor={colors.disabled} />
        ) : null}
        {remainingLine.length > 1 ? (
          <Polyline coordinates={remainingLine} strokeWidth={5} strokeColor={colors.accent} />
        ) : null}
        {target ? <Marker coordinate={toLatLng(target)} title={target.address} /> : null}
        {hasCar ? (
          <Marker
            coordinate={toLatLng(sim.coordinate)}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={carTracks}
            zIndex={10}
          >
            <View style={styles.car}>
                <FontAwesome5 name="sleigh" size={20} color="#fff" solid />
            </View>
          </Marker>
        ) : null}
      </MapView>

      <SafeAreaView edges={["bottom"]} style={styles.panel}>
        <View style={styles.phaseRow}>
          <Ionicons name={PHASE_ICON[sim.phase]} size={18} color={phaseColor} />
          <Text style={[styles.step, { color: phaseColor }]}>{MESSAGES[leg][sim.phase]}</Text>
        </View>
        <Text style={styles.address}>{target?.address}</Text>

        {arrived ? (
          <Text style={styles.detail}>
            {onBoard ? "Toca Finalizar viaje para ir al cobro." : "Toca Pasajero a bordo cuando suba."}
          </Text>
        ) : (
          <Text style={styles.detail}>
            {remainingKm} km{remainingMin !== null ? ` · ${remainingMin} min restantes` : ""}
          </Text>
        )}

        {/* Velocidad de la simulación (solo afecta la animación, no la tarifa). */}
        <View style={styles.speedRow}>
          <Ionicons name="speedometer-outline" size={16} color={colors.muted} />
          <Text style={styles.speedLabel}>Simulación</Text>
          {SPEEDS.map((value) => (
            <Pressable
              key={value}
              accessibilityRole="button"
              accessibilityLabel={`Velocidad x${value}`}
              onPress={() => setSpeed(value)}
              style={[styles.chip, speed === value && styles.chipActive]}
            >
              <Text style={[styles.chipText, speed === value && styles.chipTextActive]}>x{value}</Text>
            </Pressable>
          ))}
        </View>

        {error ? <Banner tone="danger">{error}</Banner> : null}

        {onBoard ? (
          <Button
            title="Finalizar viaje"
            kind={arrived ? "primary" : "secondary"}
            onPress={() => run(() => completeTrip(trip))}
            loading={busy}
            disabled={busy}
          />
        ) : (
          <>
            <Button
              title="Pasajero a bordo"
              kind={arrived ? "primary" : "secondary"}
              onPress={() => run(() => markPassengerOnBoard(tripId))}
              loading={busy}
              disabled={busy}
            />
            {/* Solo se puede cancelar antes de in_progress (PDF sección 3). */}
            <Button
              title="Cancelar viaje"
              kind="secondary"
              onPress={() => run(() => cancelTrip(tripId))}
              disabled={busy}
            />
          </>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  map: { flex: 1 },
  car: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#C62828", // rojo navideño
    borderWidth: 3,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  panel: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius * 1.5,
    borderTopRightRadius: radius * 1.5,
    padding: spacing,
    gap: 6,
  },
  phaseRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  step: { fontSize: 13, fontWeight: "700", textTransform: "uppercase" },
  address: { fontSize: 18, fontWeight: "700", color: colors.text },
  detail: { fontSize: 14, color: colors.muted, marginBottom: 4 },
  speedRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  speedLabel: { fontSize: 13, color: colors.muted, marginRight: 4 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: "600", color: colors.text },
  chipTextActive: { color: "#fff" },
});
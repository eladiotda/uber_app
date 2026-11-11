// Viaje en curso (PDF sección 3): ruta al punto de recogida; con "Pasajero a bordo" la ruta cambia al destino.
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  cancelTrip,
  completeTrip,
  markDriverArriving,
  markPassengerOnBoard,
  watchTrip,
} from "../services/tripRepository";
import { toLatLng } from "../services/routes";
import { Banner, Button } from "../components/FormControls";
import { colors, radius, spacing } from "../theme/colors";
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
export default function TripInProgressScreen({ navigation, route }) {
  const { tripId } = route.params;
  const [trip, setTrip] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const arrivingSent = useRef(false);
  // Escucha el viaje en tiempo real; la limpieza deja de escuchar al salir.
  useEffect(
    () =>
      watchTrip(tripId, setTrip, (watchError) => setError(watchError.message)),
    [tripId],
  );
  // accepted -> driver_arriving: el conductor sale hacia el punto de recogida.
  useEffect(() => {
    if (trip?.status === "accepted" && !arrivingSent.current) {
      arrivingSent.current = true;
      markDriverArriving(tripId).catch((updateError) =>
        setError(updateError.message),
      );
    }
    if (trip?.status === "completed")
      navigation.replace("PaymentSummary", { tripId });
    if (trip?.status === "cancelled") navigation.popToTop();
  }, [trip?.status, tripId, navigation]);
  const onBoard = trip?.status === "in_progress";
  // Antes de recoger: ruta conductor -> origen. Después: ruta guardada origen -> destino.
  const points = useMemo(() => {
    if (!trip) return [];
    if (onBoard) return trip.route || [];
    return trip.pickup?.points || [trip.origin];
  }, [trip, onBoard]);
  const target = onBoard ? trip?.destination : trip?.origin;
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
  return (
    <View style={styles.container}>
      <MapView style={styles.map} region={regionFor(points)} showsUserLocation>
        {points.length > 1 ? (
          <Polyline
            coordinates={points.map(toLatLng)}
            strokeWidth={5}
            strokeColor={colors.accent}
          />
        ) : null}
        {target ? (
          <Marker coordinate={toLatLng(target)} title={target.address} />
        ) : null}
      </MapView>
      <SafeAreaView edges={["bottom"]} style={styles.panel}>
        <Text style={styles.step}>
          {onBoard ? "Rumbo al destino" : "Rumbo al punto de recogida"}
        </Text>
        <Text style={styles.address}>{target?.address}</Text>
        {!onBoard && trip.pickup ? (
          <Text style={styles.detail}>
            {trip.pickup.distanceKm} km · {trip.pickup.durationMin} min para
            llegar
          </Text>
        ) : null}
        {onBoard ? (
          <Text style={styles.detail}>
            {trip.distanceKm} km · {trip.durationMin} min estimados
          </Text>
        ) : null}
        {error ? <Banner tone="danger">{error}</Banner> : null}
        {onBoard ? (
          <Button
            title="Finalizar viaje"
            onPress={() => run(() => completeTrip(trip))}
            loading={busy}
            disabled={busy}
          />
        ) : (
          <>
            <Button
              title="Pasajero a bordo"
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
  panel: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius * 1.5,
    borderTopRightRadius: radius * 1.5,
    padding: spacing,
    gap: 6,
  },
  step: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.accent,
    textTransform: "uppercase",
  },
  address: { fontSize: 18, fontWeight: "700", color: colors.text },
  detail: { fontSize: 14, color: colors.muted, marginBottom: 4 },
});

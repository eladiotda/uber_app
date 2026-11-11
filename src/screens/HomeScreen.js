// Inicio (PDF sección 3): mapa con la ubicación actual e interruptor Disponible / No disponible.
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useIsFocused } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  AVAILABILITY_KEY,
  useRegistration,
} from "../context/RegistrationContext";
import { useTrip } from "../context/TripContext";
import { useDriverLocation } from "../hooks/useDriverLocation";
import { useTripRequests } from "../hooks/useTripRequests";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { setAvailability } from "../services/driverRepository";
import { Banner } from "../components/FormControls";
import { colors, radius, spacing } from "../theme/colors";
// Centro de Medellín mientras llega la primera ubicación.
const DEFAULT_REGION = {
  latitude: 6.2442,
  longitude: -75.5812,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};
// Pantalla que corresponde a cada estado del viaje (el campo status controla la navegación).
const SCREEN_FOR_STATUS = {
  accepted: "TripInProgress",
  driver_arriving: "TripInProgress",
  in_progress: "TripInProgress",
  completed: "PaymentSummary",
};
export default function HomeScreen({ navigation }) {
  const { driverId, record } = useRegistration();
  const { activeTrip } = useTrip();
  const isFocused = useIsFocused();
  const [available, setAvailable] = useState(record?.available === true);
  const [toggleError, setToggleError] = useState("");
  const { location, error: locationError } = useDriverLocation({
    driverId,
    enabled: isFocused,
    share: isFocused && available,
  });
  const { nextRequest, error: requestError } = useTripRequests({
    category: record?.vehicle?.category,
    enabled: isFocused && available && !activeTrip,
  });
  const { pushError } = usePushNotifications({ driverId, enabled: true });
  // Si hay un viaje abierto (por ejemplo, se cerró la app), vuelve a su pantalla.
  useEffect(() => {
    const screen = activeTrip && SCREEN_FOR_STATUS[activeTrip.status];
    if (isFocused && screen)
      navigation.navigate(screen, { tripId: activeTrip.id });
  }, [activeTrip, isFocused, navigation]);
  // Llega una solicitud nueva: se abre la tarjeta con el temporizador.
  useEffect(() => {
    if (isFocused && nextRequest)
      navigation.navigate("IncomingRequest", {
        trip: nextRequest,
        driverLocation: location,
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextRequest?.id, isFocused]);
  const changeAvailability = useCallback(
    async (value) => {
      setToggleError("");
      setAvailable(value);
      try {
        await setAvailability(driverId, value);
        await AsyncStorage.setItem(AVAILABILITY_KEY, String(value));
      } catch (error) {
        setAvailable(!value);
        setToggleError(`No se pudo cambiar tu estado: ${error.message}`);
      }
    },
    [driverId],
  );
  // Recupera el último estado de disponibilidad guardado en AsyncStorage (preferencia, no dato sensible).
  useEffect(() => {
    AsyncStorage.getItem(AVAILABILITY_KEY)
      .then((saved) => {
        if (saved === "true" && !record?.available) changeAvailability(true);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const region = location
    ? {
        latitude: location.lat,
        longitude: location.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    : DEFAULT_REGION;
  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFill}
        region={region}
        showsUserLocation
        showsMyLocationButton
      >
        {location ? (
          <Marker
            coordinate={{ latitude: location.lat, longitude: location.lng }}
            title="Tú"
            pinColor={colors.accent}
          />
        ) : null}
      </MapView>
      <SafeAreaView
        edges={["top"]}
        style={styles.overlay}
        pointerEvents="box-none"
      >
        <View style={styles.card}>
          <View style={styles.row}>
            <View>
              <Text style={styles.status}>
                {available ? "Disponible" : "No disponible"}
              </Text>
              <Text style={styles.detail}>
                {available
                  ? "Recibiendo solicitudes de viaje"
                  : "Activa el interruptor para recibir viajes"}
              </Text>
            </View>
            <Switch
              value={available}
              onValueChange={changeAvailability}
              trackColor={{ true: colors.accent, false: colors.border }}
              thumbColor="#fff"
            />
          </View>
          {!location && !locationError ? (
            <View style={styles.row}>
              <ActivityIndicator color={colors.accent} />
              <Text style={styles.detail}>Buscando tu ubicación…</Text>
            </View>
          ) : null}
        </View>
        {[toggleError, locationError, requestError]
          .filter(Boolean)
          .map((message) => (
            <Banner key={message} tone="danger">
              {message}
            </Banner>
          ))}
        {pushError && __DEV__ ? (
          <Banner tone="warning">Notificaciones: {pushError}</Banner>
        ) : null}
      </SafeAreaView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: { padding: spacing, gap: 8 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius,
    padding: spacing,
    gap: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  status: { fontSize: 20, fontWeight: "700", color: colors.text },
  detail: { fontSize: 14, color: colors.muted },
});

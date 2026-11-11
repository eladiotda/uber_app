// Ubicación del conductor (PDF sección 3: Inicio).
// - Siempre muestra la ubicación en el mapa mientras la pantalla está abierta.
// - Si `share` es true (Disponible), la escribe en Firestore cada UPDATE_EVERY_MS.
// - Al pasar a No disponible o salir de la pantalla, la función de limpieza detiene el seguimiento.
import { useEffect, useRef, useState } from "react";
import * as Location from "expo-location";
import { updateDriverLocation } from "../services/driverRepository";
const UPDATE_EVERY_MS = 5000;
export function useDriverLocation({ driverId, enabled, share }) {
  const [location, setLocation] = useState(null); // { lat, lng }
  const [error, setError] = useState("");
  const lastSent = useRef(0);
  useEffect(() => {
    if (!enabled) return undefined;
    let active = true;
    let subscription = null;
    (async () => {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!active) return;
      if (permission.status !== "granted") {
        setError(
          "Debes permitir el acceso a la ubicación para recibir viajes.",
        );
        return;
      }
      setError("");
      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: UPDATE_EVERY_MS,
          distanceInterval: 10,
        },
        (position) => {
          const point = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setLocation(point);
          // Se escribe en la base de datos como máximo cada 5 segundos.
          const now = Date.now();
          if (share && driverId && now - lastSent.current >= UPDATE_EVERY_MS) {
            lastSent.current = now;
            updateDriverLocation(driverId, point).catch(() => {});
          }
        },
      );
      if (!active) subscription.remove(); // la pantalla se cerró mientras se pedía el permiso
    })().catch((watchError) => active && setError(watchError.message));
    return () => {
      active = false;
      subscription?.remove(); // limpieza: detiene el seguimiento
    };
  }, [enabled, share, driverId]);
  return { location, error };
}

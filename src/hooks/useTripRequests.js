// Solicitudes entrantes en tiempo real (onSnapshot) para la categoría del conductor.
// Solo escucha cuando `enabled` es true (Disponible, en Inicio y sin viaje activo).
import { useEffect, useState } from "react";
import { watchRequestedTrips } from "../services/tripRepository";
export function useTripRequests({ category, enabled }) {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!enabled || !category) {
      setRequests([]);
      return undefined;
    }
    const unsubscribe = watchRequestedTrips(
      category,
      (trips) => {
        setRequests(trips);
        setError("");
      },
      (watchError) => setError(watchError.message),
    );
    return unsubscribe; // limpieza: deja de escuchar al ponerse No disponible o salir
  }, [category, enabled]);
  return { requests, nextRequest: requests[0] || null, error };
}

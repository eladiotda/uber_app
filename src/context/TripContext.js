// Viaje activo del conductor, compartido con useContext (PDF sección 3: sesión y viaje activo).
// Escucha en tiempo real el viaje abierto (accepted, driver_arriving, in_progress o completed).
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useRegistration } from './RegistrationContext';
import { watchActiveTrip } from '../services/tripRepository';
const TripContext = createContext(null);
export function TripProvider({ children }) {
  const { driverId, status } = useRegistration();
  const [activeTrip, setActiveTrip] = useState(null);
  const [tripError, setTripError] = useState('');
  useEffect(() => {
    if (!driverId || status !== 'approved') {
      setActiveTrip(null);
      return undefined;
    }
    const unsubscribe = watchActiveTrip(
      driverId,
      (trip) => {
        setActiveTrip(trip);
        setTripError('');
      },
      (error) => setTripError(error.message),
    );
    return unsubscribe; // limpieza: deja de escuchar al salir o cerrar sesión
  }, [driverId, status]);
  const value = useMemo(() => ({ activeTrip, tripError }), [activeTrip, tripError]);
  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}
export function useTrip() {
  const context = useContext(TripContext);
  if (!context) throw new Error('useTrip debe usarse dentro de <TripProvider>.');
  return context;
}

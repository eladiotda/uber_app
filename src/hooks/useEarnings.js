// Ganancias del conductor (PDF sección 5): totales de hoy, la semana y el mes, y el saldo.
// Se escuchan los viajes pagados en tiempo real y los totales se calculan con useMemo.
import { useEffect, useMemo, useState } from 'react';
import { watchPaidTrips } from '../services/tripRepository';
import { driverBalance, periodRange, summarizeTrips, tripsInRange } from '../utils/earnings';
export function useEarnings(driverId) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!driverId) return undefined;
    const unsubscribe = watchPaidTrips(
      driverId,
      (paidTrips) => {
        setTrips(paidTrips);
        setLoading(false);
      },
      (watchError) => {
        setError(watchError.message);
        setLoading(false);
      },
    );
    return unsubscribe; // limpieza: deja de escuchar al salir de la pantalla
  }, [driverId]);
  const summaries = useMemo(() => {
    const today = new Date();
    return {
      today: summarizeTrips(tripsInRange(trips, periodRange('today', today))),
      week: summarizeTrips(tripsInRange(trips, periodRange('week', today))),
      month: summarizeTrips(tripsInRange(trips, periodRange('month', today))),
    };
  }, [trips]);
  const balance = useMemo(() => driverBalance(trips), [trips]);
  return { summaries, balance, loading, error };
}

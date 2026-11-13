
import { useEffect, useMemo, useRef, useState } from 'react';
import { buildRouteProfile, positionAt, routeKey } from '../utils/routeProgress';

const TICK_MS = 100; // 10 actualizaciones por segundo: movimiento suave

export function useRouteSimulation(points, { durationSec = 25, speed = 1 } = {}) {
  const key = routeKey(points);
  // Solo se recalcula si cambia la ruta (no cada vez que llega un cambio del viaje desde Firestore).
  const profile = useMemo(() => buildRouteProfile(points), [key]); // eslint-disable-line react-hooks/exhaustive-deps
  const [state, setState] = useState({ key, meters: 0 });
  const traveled = state.key === key ? state.meters : 0; // al cambiar de tramo arranca en cero

  // La velocidad (x1, x2, x4) se lee en cada paso sin reiniciar el recorrido.
  const speedRef = useRef(speed);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    let meters = 0;
    setState({ key, meters: 0 });
    if (profile.totalMeters <= 0) return undefined;
    const metersPerSecond = profile.totalMeters / Math.max(1, durationSec);
    let last = Date.now();
    const timer = setInterval(() => {
      const now = Date.now();
      meters = Math.min(profile.totalMeters, meters + metersPerSecond * speedRef.current * ((now - last) / 1000));
      last = now;
      setState({ key, meters });
      if (meters >= profile.totalMeters) clearInterval(timer);
    }, TICK_MS);
    return () => clearInterval(timer); // limpieza
  }, [profile, durationSec, key]);

  const position = useMemo(() => positionAt(profile, traveled), [profile, traveled]);
  return { ...position, routeId: key };
}
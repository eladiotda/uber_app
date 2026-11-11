import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  startAfter,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getFirebase } from './firebase';
import { calculateFare } from '../utils/calculateFare';
import { PRICING } from '../config/pricing';
// Estados en los que el conductor tiene un viaje "abierto".
export const OPEN_TRIP_STATUSES = ['accepted', 'driver_arriving', 'in_progress', 'completed'];
const tripsCollection = () => collection(getFirebase().db, 'trips');
const tripRef = (tripId) => doc(getFirebase().db, 'trips', tripId);
const withId = (snapshot) => ({ id: snapshot.id, ...snapshot.data() });
// Firestore devuelve Timestamp; al crear desde la app puede ser null un instante (serverTimestamp pendiente).
export function toDate(value) {
  if (!value) return null;
  if (value.toDate) return value.toDate();
  return value instanceof Date ? value : new Date(value);
}
// ---------- Simulador de solicitudes (reemplaza la app del pasajero en las pruebas) ----------
// route = resultado de getRoute(origin, destination): se calcula UNA vez al crear la solicitud.
export async function createTestTrip({ origin, destination, route, category, paymentMethod, tip = 0, rating }) {
  const estimate = calculateFare({ distanceKm: route.distanceKm, durationMin: route.durationMin, category, tip });
  const ref = await addDoc(tripsCollection(), {
    status: 'requested',
    driverId: null,
    passengerId: 'simulated-passenger',
    origin,
    destination,
    distanceKm: route.distanceKm,
    durationMin: route.durationMin,
    route: route.points,
    category,
    paymentMethod,
    tip,
    estimatedFare: estimate.fare,
    estimatedEarnings: estimate.driverEarnings,
    rating: rating ?? null, // calificación del pasajero (simulada)
    paymentStatus: paymentMethod === 'cash' ? 'cash_pending' : 'pending',
    createdAt: serverTimestamp(),
  });
  return ref.id;
}
// ---------- Solicitudes entrantes ----------
// Escucha en tiempo real las solicitudes de la categoría del conductor. Devuelve la función de limpieza.
export function watchRequestedTrips(category, onChange, onError) {
  const q = query(tripsCollection(), where('status', '==', 'requested'), where('category', '==', category), limit(10));
  return onSnapshot(
    q,
    (snapshot) => {
      const trips = snapshot.docs.map(withId);
      // Se ordena en el celular (más antigua primero) para no necesitar un índice compuesto.
      trips.sort((a, b) => (toDate(a.createdAt)?.getTime() || 0) - (toDate(b.createdAt)?.getTime() || 0));
      onChange(trips);
    },
    onError,
  );
}
// Aceptar con transacción: si otro conductor la tomó primero, falla.
export async function acceptTrip(tripId, driverId, pickup) {
  const { db } = getFirebase();
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(tripRef(tripId));
    if (!snapshot.exists() || snapshot.data().status !== 'requested') {
      throw new Error('La solicitud ya no está disponible.');
    }
    transaction.update(tripRef(tripId), {
      status: 'accepted',
      driverId,
      pickup: pickup || null, // { distanceKm, durationMin, points } del conductor al punto de recogida
      acceptedAt: serverTimestamp(),
    });
  });
}
// reason = 'manual' (tocó Rechazar) o 'timeout' (se acabaron los 15 segundos).
export function rejectTrip(tripId, driverId, reason) {
  return updateDoc(tripRef(tripId), {
    status: 'rejected',
    driverId,
    rejectReason: reason,
    rejectedAt: serverTimestamp(),
  });
}
// ---------- Viaje en curso ----------
export function watchTrip(tripId, onChange, onError) {
  return onSnapshot(tripRef(tripId), (snapshot) => onChange(snapshot.exists() ? withId(snapshot) : null), onError);
}
// Viaje abierto del conductor (para volver a la pantalla correcta si cierra la app).
export function watchActiveTrip(driverId, onChange, onError) {
  const q = query(
    tripsCollection(),
    where('driverId', '==', driverId),
    where('status', 'in', OPEN_TRIP_STATUSES),
    limit(1),
  );
  return onSnapshot(q, (snapshot) => onChange(snapshot.empty ? null : withId(snapshot.docs[0])), onError);
}
export function markDriverArriving(tripId) {
  return updateDoc(tripRef(tripId), { status: 'driver_arriving' });
}
export function markPassengerOnBoard(tripId) {
  return updateDoc(tripRef(tripId), { status: 'in_progress', startedAt: serverTimestamp() });
}
export function cancelTrip(tripId) {
  return updateDoc(tripRef(tripId), { status: 'cancelled', cancelledAt: serverTimestamp() });
}
// Cierre del viaje: misma función calculateFare de la estimación. Se guarda el commissionRate aplicado.
export async function completeTrip(trip) {
  const result = calculateFare({
    distanceKm: trip.distanceKm,
    durationMin: trip.durationMin,
    category: trip.category,
    tip: trip.tip || 0,
  });
  const changes = {
    status: 'completed',
    fare: result.fare,
    commission: result.commission,
    tip: result.tip,
    driverEarnings: result.driverEarnings,
    commissionRate: PRICING.commissionRate,
    completedAt: serverTimestamp(),
  };
  await updateDoc(tripRef(trip.id), changes);
  return changes;
}
// Pago en efectivo: el conductor marca el cobro como recibido (PDF sección 4).
export function markCashPaid(tripId) {
  return updateDoc(tripRef(tripId), { status: 'paid', paymentStatus: 'cash', paidAt: serverTimestamp() });
}
// ---------- Historial y ganancias ----------
// Página de historial: más reciente primero, 20 por carga. Necesita los índices de firestore.indexes.json.
export async function fetchTripsPage(driverId, { from, to, paymentMethod, after, pageSize = 20 } = {}) {
  const constraints = [where('driverId', '==', driverId)];
  if (paymentMethod) constraints.push(where('paymentMethod', '==', paymentMethod));
  if (from) constraints.push(where('createdAt', '>=', from));
  if (to) constraints.push(where('createdAt', '<=', to));
  constraints.push(orderBy('createdAt', 'desc'));
  if (after) constraints.push(startAfter(after));
  constraints.push(limit(pageSize));
  const snapshot = await getDocs(query(tripsCollection(), ...constraints));
  return {
    trips: snapshot.docs.map(withId),
    cursor: snapshot.docs[snapshot.docs.length - 1] || null,
    hasMore: snapshot.docs.length === pageSize,
  };
}
// Viajes pagados del conductor, en tiempo real (base para Ganancias y el saldo).
export function watchPaidTrips(driverId, onChange, onError) {
  const q = query(tripsCollection(), where('driverId', '==', driverId), where('status', '==', 'paid'), limit(500));
  return onSnapshot(q, (snapshot) => onChange(snapshot.docs.map(withId)), onError);
}
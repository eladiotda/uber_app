// Pagos con Mercado Pago Checkout Pro (PDF sección 4).
// La app NUNCA tiene el access_token: le pide al backend que cree la preferencia de pago.
import * as WebBrowser from 'expo-web-browser';
import { getFirebase } from './firebase';
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
export const isBackendConfigured = Boolean(BACKEND_URL);
// 1) Envía al backend el tripId (el backend lee el monto desde Firestore, no confía en la app).
// 2) Abre el checkout para que el pasajero pague con una tarjeta de prueba.
// 3) El resultado llega por webhook al backend, que actualiza el viaje; la app lo ve con onSnapshot.
export async function openCheckout(tripId) {
  if (!BACKEND_URL) throw new Error('Falta EXPO_PUBLIC_BACKEND_URL en el archivo .env.');
  const { auth } = getFirebase();
  const idToken = await auth.currentUser.getIdToken(); // el backend verifica quién hace la petición
  const response = await fetch(`${BACKEND_URL}/payments/preference`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ tripId }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'No se pudo crear el pago.');
  await WebBrowser.openBrowserAsync(data.checkoutUrl);
}
// Texto del estado del pago para mostrar en pantalla.
export function paymentStatusLabel(trip) {
  if (trip.paymentMethod === 'cash') return trip.status === 'paid' ? 'Efectivo' : 'Efectivo (por cobrar)';
  switch (trip.paymentStatus) {
    case 'approved':
      return 'Aprobado';
    case 'rejected':
    case 'cancelled':
      return 'Rechazado';
    default:
      return 'Pendiente';
  }
}

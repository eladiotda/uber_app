import { getFirebase } from './firebase';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export async function requestDevApproval() {
  if (!BACKEND_URL) throw new Error('Falta EXPO_PUBLIC_BACKEND_URL en el archivo .env.');
  const { auth } = getFirebase();
  const idToken = await auth.currentUser.getIdToken(); // el backend verifica quién hace la petición
  const response = await fetch(`${BACKEND_URL}/dev/approve-driver`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
      'ngrok-skip-browser-warning': '1', // evita la página de advertencia de ngrok gratis
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    // Si el backend está apagado, ngrok responde 502 sin JSON: se muestra el código para saber la causa.
    throw new Error(data.error || `No se pudo aprobar la cuenta (HTTP ${response.status}). ¿Está encendido el backend?`);
  }
}
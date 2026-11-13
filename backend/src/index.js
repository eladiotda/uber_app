import { readFileSync } from 'node:fs';
import express from 'express';
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import { cert, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getMessaging } from 'firebase-admin/messaging';
const { MP_ACCESS_TOKEN, PUBLIC_URL, FIREBASE_SERVICE_ACCOUNT_FILE, PORT = '3000' } = process.env;
if (!MP_ACCESS_TOKEN || !PUBLIC_URL || !FIREBASE_SERVICE_ACCOUNT_FILE) {
  console.error('Faltan variables en backend/.env (ver backend/.env.example).');
  process.exit(1);
}
initializeApp({ credential: cert(JSON.parse(readFileSync(FIREBASE_SERVICE_ACCOUNT_FILE, 'utf8'))) });
const db = getFirestore();
const mercadoPago = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });
const app = express();
app.use(express.json());
app.get('/', (_req, res) => res.send('UberClone backend funcionando'));
// ---------- 1) Crear la preferencia de pago ----------
app.post('/payments/preference', async (req, res) => {
  try {
    // Solo el conductor dueño del viaje puede cobrarlo (token de Firebase Auth enviado por la app).
    const idToken = (req.headers.authorization || '').replace('Bearer ', '');
    const { uid } = await getAuth().verifyIdToken(idToken);
    const { tripId } = req.body;
    const snapshot = await db.collection('trips').doc(String(tripId)).get();
    if (!snapshot.exists) return res.status(404).json({ error: 'El viaje no existe.' });
    const trip = snapshot.data();
    if (trip.driverId !== uid) return res.status(403).json({ error: 'Este viaje no es tuyo.' });
    if (trip.status !== 'completed' || trip.paymentMethod !== 'mercadopago') {
      return res.status(400).json({ error: 'El viaje no está listo para cobrarse con Mercado Pago.' });
    }
    // El monto sale de la base de datos (no del celular): tarifa + propina.
    const amount = (trip.fare || 0) + (trip.tip || 0);
    const preference = await new Preference(mercadoPago).create({
      body: {
        items: [
          {
            id: snapshot.id,
            title: `Viaje UberClone: ${trip.origin?.address} → ${trip.destination?.address}`,
            quantity: 1,
            unit_price: amount,
            currency_id: 'COP',
          },
        ],
        external_reference: snapshot.id, // así el webhook sabe qué viaje actualizar
        notification_url: `${PUBLIC_URL}/webhooks/mercadopago`,
        back_urls: {
          success: `${PUBLIC_URL}/payments/return`,
          failure: `${PUBLIC_URL}/payments/return`,
          pending: `${PUBLIC_URL}/payments/return`,
        },
        auto_return: 'approved',
      },
    });
    await snapshot.ref.update({ paymentStatus: 'pending', preferenceId: preference.id });
    res.json({ checkoutUrl: preference.init_point || preference.sandbox_init_point });
  } catch (error) {
    console.error('Error creando la preferencia:', error);
    res.status(500).json({ error: 'No se pudo crear el pago.' });
  }
});
// Página a la que vuelve el navegador después de pagar.
app.get('/payments/return', (req, res) => {
  res.send(`<h2>Pago ${req.query.status || 'procesado'}</h2><p>Ya puedes cerrar esta ventana y volver a la app.</p>`);
});
// ---------- Solo pruebas: aprobar al conductor desde la app ----------
// AI-assisted: see docs/AI_LOG.md #N
// Simula la revisión manual (PDF sección 2). Se activa con ALLOW_DEV_APPROVAL=true en backend/.env.
// Solo aprueba al conductor dueño del token, y solo si está en "pending".
app.post('/dev/approve-driver', async (req, res) => {
  if (process.env.ALLOW_DEV_APPROVAL !== 'true') {
    return res.status(403).json({ error: 'La aprobación desde la app está desactivada en el backend.' });
  }
  try {
    const idToken = (req.headers.authorization || '').replace('Bearer ', '');
    const { uid } = await getAuth().verifyIdToken(idToken);
    const ref = db.collection('drivers').doc(uid);
    const snapshot = await ref.get();
    if (!snapshot.exists) return res.status(404).json({ error: 'No existe el registro del conductor.' });
    if (snapshot.get('status') !== 'pending') {
      return res.status(400).json({ error: 'La cuenta no está pendiente de aprobación.' });
    }
    await ref.update({ status: 'approved', approvedAt: FieldValue.serverTimestamp() });
    res.json({ ok: true });
  } catch (error) {
    console.error('Error aprobando conductor:', error.message);
    res.status(401).json({ error: 'No se pudo verificar la sesión.' });
  }
});
// ---------- 2) Webhook de Mercado Pago ----------
const STATUS_MAP = {
  approved: 'approved',
  rejected: 'rejected',
  cancelled: 'rejected',
  refunded: 'rejected',
  pending: 'pending',
  in_process: 'pending',
  authorized: 'pending',
};
app.post('/webhooks/mercadopago', async (req, res) => {
  res.sendStatus(200); // se responde rápido; Mercado Pago reintenta si no recibe 200
  try {
    const type = req.body?.type || req.query.type || req.query.topic;
    const paymentId = req.body?.data?.id || req.query['data.id'] || req.query.id;
    if (type !== 'payment' || !paymentId) return;
    // Seguridad: no se confía en el cuerpo del webhook; se consulta el pago real con la llave secreta.
    const payment = await new Payment(mercadoPago).get({ id: paymentId });
    const tripId = payment.external_reference;
    if (!tripId) return;
    const paymentStatus = STATUS_MAP[payment.status] || 'pending';
    const changes = { paymentStatus, paymentId: String(payment.id), paymentUpdatedAt: FieldValue.serverTimestamp() };
    if (paymentStatus === 'approved') {
      changes.status = 'paid';
      changes.paidAt = FieldValue.serverTimestamp();
    }
    await db.collection('trips').doc(tripId).update(changes);
    console.log(`Viaje ${tripId}: pago ${payment.status}`);
  } catch (error) {
    console.error('Error procesando el webhook:', error.message);
  }
});
// ---------- 3) Notificación FCM de nuevas solicitudes ----------
// Escucha los viajes "requested" y avisa a los conductores aprobados, disponibles y de la misma categoría.
const startedAt = Date.now();
db.collection('trips')
  .where('status', '==', 'requested')
  .onSnapshot(
    (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type !== 'added') return;
        const trip = change.doc.data();
        const createdAt = trip.createdAt?.toMillis?.() || Date.now();
        if (createdAt < startedAt - 60_000) return; // no reenviar solicitudes viejas al reiniciar
        const drivers = await db
          .collection('drivers')
          .where('status', '==', 'approved')
          .where('available', '==', true)
          .where('vehicle.category', '==', trip.category)
          .get();
        await Promise.all(
          drivers.docs
            .map((driver) => driver.get('fcmToken'))
            .filter(Boolean)
            .map((token) =>
              getMessaging()
                .send({
                  token,
                  notification: {
                    title: 'Nueva solicitud de viaje',
                    body: `${trip.origin?.address} → ${trip.destination?.address} (${trip.distanceKm} km)`,
                  },
                  data: { tripId: change.doc.id },
                  android: { priority: 'high', notification: { channelId: 'trip-requests' } },
                })
                .catch((error) => console.error('FCM:', error.message)),
            ),
        );
      });
    },
    (error) => console.error('Error escuchando solicitudes:', error.message),
  );
app.listen(Number(PORT), () => console.log(`Backend en http://localhost:${PORT} (público: ${PUBLIC_URL})`));
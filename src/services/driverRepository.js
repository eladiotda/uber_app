import { doc, getDoc, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { getFirebase } from './firebase';
import { normalizePlate } from '../utils/validations';
import { PRICING } from '../config/pricing';
// Fotos de la pestaña 3: cada una va en su propio documento para no pasar el límite de 1 MiB.
export const DOCUMENT_FILES = ['license', 'soat', 'rtm'];
// Formulario -> documento de la base de datos. Las fotos ya vienen comprimidas en base64 (data:image/jpeg...).
export function toDriverDocument(personal, vehicle) {
  return {
    personal: {
      photoUrl: personal.photo,
      fullName: personal.fullName.trim(),
      documentId: personal.documentId,
      phone: personal.phone,
      birthDate: personal.birthDate, // 'AAAA-MM-DD'
      gender: personal.gender,
      email: personal.email.trim().toLowerCase(),
      language: personal.language,
    },
    vehicle: {
      photoUrl: vehicle.photo,
      category: vehicle.category,
      plate: normalizePlate(vehicle.plate),
      brand: vehicle.brand.trim(),
      model: vehicle.model.trim(),
      year: Number(vehicle.year),
      color: vehicle.color,
      capacity: Number(vehicle.capacity),
    },
  };
}
// Pestaña 3 -> mapa "documents" (sin fotos: las fotos van en la subcolección files).
// No se guardan números de cuenta ni de tarjeta: solo el correo de Mercado Pago (PDF sección 2).
export function toDocumentsData(documents) {
  return {
    licenseNumber: documents.licenseNumber,
    licenseCategory: documents.licenseCategory,
    licenseExpiry: documents.licenseExpiry,
    soatExpiry: documents.soatExpiry,
    rtmExpiry: documents.rtmExpiry || null,
    mercadoPagoEmail: documents.mercadoPagoEmail.trim().toLowerCase(),
    termsAccepted: documents.termsAccepted === true,
    commissionRateAccepted: PRICING.commissionRate,
  };
}
// Documento de la base de datos -> formulario (los números vuelven a texto para los campos).
export function toForm(data, files = {}) {
  const { photoUrl: personalPhoto, ...personal } = data.personal || {};
  const { photoUrl: vehiclePhoto, ...vehicle } = data.vehicle || {};
  const documents = data.documents || {};
  return {
    personal: { ...personal, photo: personalPhoto || '' },
    vehicle: {
      ...vehicle,
      photo: vehiclePhoto || '',
      year: vehicle.year ? String(vehicle.year) : '',
      capacity: vehicle.capacity ? String(vehicle.capacity) : '',
    },
    documents: {
      ...documents,
      rtmExpiry: documents.rtmExpiry || '',
      licensePhoto: files.license || '',
      soatPhoto: files.soat || '',
      rtmPhoto: files.rtm || '',
    },
  };
}
function driverRef(uid) {
  const { db } = getFirebase();
  return doc(db, 'drivers', uid);
}
export async function loadDriver(uid) {
  const snapshot = await getDoc(driverRef(uid));
  return snapshot.exists() ? snapshot.data() : null;
}
// Escucha el documento del conductor en tiempo real (por ejemplo, cuando lo aprueban en la consola).
// Devuelve la función para dejar de escuchar (se usa en la limpieza de useEffect).
export function watchDriver(uid, onChange, onError) {
  return onSnapshot(
    driverRef(uid),
    (snapshot) => onChange(snapshot.exists() ? snapshot.data() : null),
    onError,
  );
}
// Lee las fotos de la licencia, el SOAT y la revisión técnico-mecánica.
export async function loadDriverFiles(uid) {
  const { db } = getFirebase();
  const entries = await Promise.all(
    DOCUMENT_FILES.map(async (fileId) => {
      const snapshot = await getDoc(doc(db, 'drivers', uid, 'files', fileId));
      return [fileId, snapshot.exists() ? snapshot.data().photoUrl : ''];
    }),
  );
  return Object.fromEntries(entries);
}
// Primera vez: crea el documento en estado 'draft' (borrador) y no disponible.
// Siguientes veces: solo actualiza los datos personales y del vehículo.
export async function saveDriverDraft(uid, personal, vehicle) {
  const ref = driverRef(uid);
  const data = toDriverDocument(personal, vehicle);
  const existing = await getDoc(ref);
  if (existing.exists()) {
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
    return { ...existing.data(), ...data, updatedAt: new Date() };
  }
  const created = {
    uid,
    status: 'draft',
    available: false,
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(ref, created);
  return { ...created, createdAt: new Date(), updatedAt: new Date() };
}
// Guarda la pestaña 3. Con submit = true el registro pasa de 'draft' a 'pending' (Pendiente de aprobación).
// files = { license, soat, rtm } con las fotos ya comprimidas (rtm puede venir vacía si no aplica).
export async function saveDriverDocuments(uid, documents, files, { submit = false } = {}) {
  const { db } = getFirebase();
  await Promise.all(
    DOCUMENT_FILES.filter((fileId) => files[fileId]).map((fileId) =>
      setDoc(doc(db, 'drivers', uid, 'files', fileId), {
        photoUrl: files[fileId],
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  const changes = { documents: toDocumentsData(documents), updatedAt: serverTimestamp() };
  if (submit) changes.status = 'pending';
  await updateDoc(driverRef(uid), changes);
}
// Disponible / No disponible. Las reglas solo lo permiten si el conductor está aprobado.
export function setAvailability(uid, available) {
  return updateDoc(driverRef(uid), { available, updatedAt: serverTimestamp() });
}
// Ubicación en tiempo real (la escribe useDriverLocation cada pocos segundos).
export function updateDriverLocation(uid, { lat, lng }) {
  return updateDoc(driverRef(uid), { location: { lat, lng, updatedAt: serverTimestamp() } });
}
// Token de notificaciones (FCM) para avisar nuevas solicitudes con la app en segundo plano.
export function saveFcmToken(uid, token) {
  return updateDoc(driverRef(uid), { fcmToken: token });
}

import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { getFirebase } from './firebase';
import { normalizePlate } from '../utils/validations';

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

// Documento de la base de datos -> formulario (los números vuelven a texto para los campos).
export function toForm(data) {
  const { photoUrl: personalPhoto, ...personal } = data.personal || {};
  const { photoUrl: vehiclePhoto, ...vehicle } = data.vehicle || {};
  return {
    personal: { ...personal, photo: personalPhoto || '' },
    vehicle: {
      ...vehicle,
      photo: vehiclePhoto || '',
      year: vehicle.year ? String(vehicle.year) : '',
      capacity: vehicle.capacity ? String(vehicle.capacity) : '',
    },
  };
}

export async function loadDriver(uid) {
  const { db } = getFirebase();
  const snapshot = await getDoc(doc(db, 'drivers', uid));
  return snapshot.exists() ? snapshot.data() : null;
}

// Primera vez: crea el documento en estado 'draft' (borrador) y no disponible.
// Siguientes veces: solo actualiza los datos personales y del vehículo.
export async function saveDriverDraft(uid, personal, vehicle) {
  const { db } = getFirebase();
  const ref = doc(db, 'drivers', uid);
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

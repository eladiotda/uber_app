import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
);

// En el celular la sesión anónima se conserva con AsyncStorage (solo la sesión, ningún dato personal).
function createAuth(app) {
  if (Platform.OS === 'web' || !FirebaseAuth.getReactNativePersistence) return FirebaseAuth.getAuth(app);
  try {
    return FirebaseAuth.initializeAuth(app, {
      persistence: FirebaseAuth.getReactNativePersistence(AsyncStorage),
    });
  } catch {
    return FirebaseAuth.getAuth(app); // ya estaba inicializado (recarga rápida)
  }
}

let services = null;

export function getFirebase() {
  if (!isFirebaseConfigured) {
    throw new Error(
      'Firebase no está configurado. Copia .env.example como .env, completa las variables EXPO_PUBLIC_FIREBASE_* y reinicia con "npx expo start -c".',
    );
  }
  if (!services) {
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    services = { app, auth: createAuth(app), db: getFirestore(app) };
  }
  return services;
}

// Inicia sesión anónima (una sola vez por celular) y devuelve el id del conductor.
export async function getDriverId() {
  const { auth } = getFirebase();
  await auth.authStateReady();
  if (!auth.currentUser) await FirebaseAuth.signInAnonymously(auth);
  return auth.currentUser.uid;
}

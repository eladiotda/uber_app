import { existsSync } from 'node:fs';
// google-services.json NO se sube a GitHub: en EAS se carga como variable de tipo archivo (GOOGLE_SERVICES_JSON);
// en el computador basta con tener el archivo en la raíz. Si no existe (Expo Go), simplemente no se usa.
const googleServicesFile =
  process.env.GOOGLE_SERVICES_JSON || (existsSync('./google-services.json') ? './google-services.json' : undefined);
// Configuración dinámica: toma app.json y agrega lo que no debe quedar escrito en el repo.
// (Las llaves salen de variables de entorno; en EAS se crean con "eas env:create".)
export default ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    package: 'com.uberclone.conductor',
    ...(googleServicesFile ? { googleServicesFile } : {}),
  },
  ios: {
    ...config.ios,
    bundleIdentifier: 'com.uberclone.conductor',
  },
  plugins: [
    ...(config.plugins || []),
    'expo-web-browser',
    // Llave de Maps SDK for Android (solo hace falta en el development build; Expo Go trae la suya).
    ['react-native-maps', { androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_ANDROID_KEY }],
  ],
});

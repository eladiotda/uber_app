// Notificaciones de nuevas solicitudes con la app en segundo plano (PDF sección 7: FCM obligatoria).
// Usa el token nativo de FCM del celular (getDevicePushTokenAsync). El backend lo usa con firebase-admin
// para enviar el aviso cuando se crea un viaje "requested" de la categoría del conductor.
// Requiere development build (no funciona en Expo Go) y el archivo google-services.json.
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { saveFcmToken } from '../services/driverRepository';
// Con la app abierta, la notificación también se muestra.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});
export function usePushNotifications({ driverId, enabled }) {
  const [pushError, setPushError] = useState('');
  useEffect(() => {
    if (!enabled || !driverId || Platform.OS === 'web') return undefined;
    let active = true;
    (async () => {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('trip-requests', {
          name: 'Solicitudes de viaje',
          importance: Notifications.AndroidImportance.MAX,
        });
      }
      const permission = await Notifications.requestPermissionsAsync();
      if (permission.status !== 'granted') throw new Error('Sin permiso de notificaciones.');
      const token = await Notifications.getDevicePushTokenAsync(); // { type: 'android' | 'ios', data }
      if (active) await saveFcmToken(driverId, token.data);
    })().catch((error) => {
      // En Expo Go no hay token FCM: la app sigue funcionando con onSnapshot en primer plano.
      if (active) setPushError(error.message);
    });
    return () => {
      active = false;
    };
  }, [driverId, enabled]);
  return { pushError };
}

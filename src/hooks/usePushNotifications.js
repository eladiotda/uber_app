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

// AI-assisted: see docs/AI_LOG.md #N
// Canal de Android con todos los campos explícitos: si alguno llega vacío,
// el módulo nativo lanza NullPointerException al crear el canal.
async function ensureTripChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('trip-requests', {
    name: 'Solicitudes de viaje',
    description: 'Avisos de nuevas solicitudes de viaje',
    importance: Notifications.AndroidImportance.MAX,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
    enableVibrate: true,
    lightColor: '#16A34A',
    showBadge: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

export function usePushNotifications({ driverId, enabled }) {
  const [pushError, setPushError] = useState('');

  useEffect(() => {
    if (!enabled || !driverId || Platform.OS === 'web') return undefined;
    let active = true;

    (async () => {
      // Si el canal falla, se registra el aviso pero se sigue intentando obtener el token.
      try {
        await ensureTripChannel();
      } catch (channelError) {
        console.warn('No se pudo crear el canal de notificaciones:', channelError?.message);
      }

      const permission = await Notifications.requestPermissionsAsync();
      if (permission.status !== 'granted') throw new Error('Sin permiso de notificaciones.');

      const token = await Notifications.getDevicePushTokenAsync(); // { type: 'android' | 'ios', data }
      if (active) {
        await saveFcmToken(driverId, token.data);
        setPushError('');
      }
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
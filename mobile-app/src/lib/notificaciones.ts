import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import api from './api';

// Que la notificación se muestre con sonido aunque la app esté abierta en ese momento
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const CANAL_ID = 'camion-cerca';

async function crearCanalAndroid() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CANAL_ID, {
    name: 'Aviso del camión recolector',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    sound: 'default',
    lightColor: '#3fb950',
  });
}

// Pide permiso, obtiene el token de push de Expo y lo registra en el backend
// (PUT /usuarios/me { pushToken }). Se llama tras el login y al abrir la app
// con sesión activa. Si algo falla (sin projectId configurado aún, sin
// permiso, emulador sin Google Play Services, etc.) no rompe nada — la app
// sigue funcionando con los avisos dentro de la app como respaldo.
export async function registrarNotificaciones() {
  try {
    await crearCanalAndroid();

    if (!Device.isDevice) return null; // los emuladores no reciben push reales

    const actual = await Notifications.getPermissionsAsync();
    let estado = actual.status;
    if (estado !== 'granted') {
      const pedido = await Notifications.requestPermissionsAsync();
      estado = pedido.status;
    }
    if (estado !== 'granted') return null;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId || projectId.includes('REEMPLAZAR')) {
      console.log('Notificaciones: falta configurar el projectId de EAS (ver app.json)');
      return null;
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    if (token) {
      await api.put('/usuarios/me', { pushToken: token }).catch(() => {});
    }
    return token || null;
  } catch (e) {
    console.log('registrarNotificaciones:', (e as Error).message);
    return null;
  }
}

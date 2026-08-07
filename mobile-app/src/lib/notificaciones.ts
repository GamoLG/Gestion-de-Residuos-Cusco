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

export interface DiagnosticoPush {
  ok: boolean;
  paso: string; // en qué paso se detuvo (para saber exactamente qué falló)
  detalle: string;
  token?: string;
}

// Pide permiso, obtiene el token de push de Expo y lo registra en el backend
// (PUT /usuarios/me { pushToken }). Se llama tras el login y al abrir la app
// con sesión activa. Devuelve SIEMPRE un diagnóstico detallado (antes fallaba
// en silencio y era imposible saber por qué nunca llegaba la notificación).
export async function registrarNotificaciones(): Promise<DiagnosticoPush> {
  try {
    await crearCanalAndroid();
  } catch (e) {
    return { ok: false, paso: 'canal', detalle: (e as Error).message };
  }

  if (!Device.isDevice) {
    return { ok: false, paso: 'dispositivo', detalle: 'Estás en un emulador. Los emuladores no reciben notificaciones push reales — prueba en un celular físico.' };
  }

  let estado: string;
  try {
    const actual = await Notifications.getPermissionsAsync();
    estado = actual.status;
    if (estado !== 'granted') {
      const pedido = await Notifications.requestPermissionsAsync();
      estado = pedido.status;
    }
  } catch (e) {
    return { ok: false, paso: 'permiso', detalle: (e as Error).message };
  }
  if (estado !== 'granted') {
    return { ok: false, paso: 'permiso', detalle: `El permiso de notificaciones está "${estado}". Actívalo en Ajustes del celular → Apps → Residuos Cusco → Notificaciones.` };
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId || projectId.includes('REEMPLAZAR')) {
    return { ok: false, paso: 'projectId', detalle: 'Falta el projectId de EAS en app.json (esta compilación no lo tiene configurado).' };
  }

  let token: string | undefined;
  try {
    const r = await Notifications.getExpoPushTokenAsync({ projectId });
    token = r.data;
  } catch (e) {
    return { ok: false, paso: 'token', detalle: (e as Error).message, };
  }
  if (!token) return { ok: false, paso: 'token', detalle: 'Expo no devolvió un token (respuesta vacía).' };

  try {
    await api.put('/usuarios/me', { pushToken: token });
  } catch (e: any) {
    return { ok: false, paso: 'registro', detalle: e?.response?.data?.message || (e as Error).message, token };
  }

  return { ok: true, paso: 'listo', detalle: 'Token registrado correctamente en el servidor.', token };
}

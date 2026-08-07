// Envío de notificaciones push REALES (con sonido, llegan aunque la app esté
// cerrada) vía el servicio gratuito de Expo. El cliente registra su token con
// PUT /api/usuarios/me { pushToken }. Requiere que el proyecto de Expo tenga
// credenciales FCM configuradas (ver docs/COMO_INICIAR.md); si un token no es
// válido o no hay credenciales, Expo simplemente no entrega ese mensaje — no
// rompe el resto del sistema.
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const LOTE = 90; // Expo admite hasta 100 mensajes por solicitud

function partir(arr, tam) {
  const partes = [];
  for (let i = 0; i < arr.length; i += tam) partes.push(arr.slice(i, i + tam));
  return partes;
}

// mensajes: [{ to, title, body, data? }] — se descartan los que no tengan
// un token de Expo válido (usuarios que aún no abrieron la app / sin permiso).
export async function enviarPush(mensajes) {
  const validos = (mensajes || []).filter(
    (m) => typeof m.to === 'string' && m.to.startsWith('ExponentPushToken')
  );
  if (!validos.length) return;

  for (const lote of partir(validos, LOTE)) {
    try {
      const r = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(
          lote.map((m) => ({
            to: m.to,
            title: m.title,
            body: m.body,
            sound: 'default',
            priority: 'high',
            channelId: 'camion-cerca',
            data: m.data || {},
          }))
        ),
      });
      if (!r.ok) console.error('enviarPush', r.status, await r.text().catch(() => ''));
    } catch (e) {
      console.error('enviarPush', e.message);
    }
  }
}

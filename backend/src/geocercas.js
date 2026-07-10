import Usuario from './models/Usuario.js';
import Alerta from './models/Alerta.js';
import TrazaGPS from './models/TrazaGPS.js';

// Distancia en metros entre dos puntos (Haversine)
export function distanciaMetros(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const rad = (x) => (x * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Velocidad estimada del camión (km/h) según sus últimas trazas; 15 km/h por defecto
async function velocidadEstimada(rutaId) {
  const trazas = await TrazaGPS.find({ ruta: rutaId }).sort('-createdAt').limit(5);
  if (trazas.length < 2) return 15;
  let dist = 0;
  for (let i = 0; i < trazas.length - 1; i++) {
    dist += distanciaMetros(trazas[i].latitud, trazas[i].longitud, trazas[i + 1].latitud, trazas[i + 1].longitud);
  }
  const seg = (trazas[0].createdAt - trazas[trazas.length - 1].createdAt) / 1000;
  if (seg <= 0) return 15;
  const kmh = (dist / seg) * 3.6;
  return Math.min(Math.max(kmh, 5), 60); // acotar a valores razonables
}

const UMBRAL_PROXIMO = 800; // m — "el camión está próximo"
const UMBRAL_LLEGO = 200; // m — "el camión llegó"
const UMBRAL_PASO = 600; // m — se alejó tras haber llegado

// Evalúa geocercas: crea avisos PROXIMIDAD / LLEGADA / PASO para los ciudadanos
// de la zona de la ruta. Devuelve cuántos avisos generó.
export async function evaluarGeocercas(ruta) {
  if (!ruta?.zona || ruta.latitudActual == null || ruta.longitudActual == null) return 0;

  const ciudadanos = await Usuario.find({
    rol: 'CIUDADANO',
    activo: true,
    zona: ruta.zona,
    latitud: { $ne: null },
    longitud: { $ne: null },
  }).select('nombre latitud longitud');
  if (!ciudadanos.length) return 0;

  const desde = ruta.fechaInicio || new Date(Date.now() - 12 * 3600 * 1000);
  // Avisos ya emitidos en esta jornada (para no repetir)
  const previas = await Alerta.find({
    ruta: ruta._id,
    createdAt: { $gte: desde },
    tipo: { $in: ['PROXIMIDAD', 'LLEGADA', 'PASO'] },
  }).select('usuario tipo');
  const ya = new Set(previas.map((a) => `${a.usuario}:${a.tipo}`));

  const kmh = await velocidadEstimada(ruta._id);
  const nuevas = [];

  for (const c of ciudadanos) {
    const d = distanciaMetros(ruta.latitudActual, ruta.longitudActual, c.latitud, c.longitud);
    const key = (t) => `${c._id}:${t}`;

    if (d <= UMBRAL_LLEGO && !ya.has(key('LLEGADA'))) {
      nuevas.push({
        tipo: 'LLEGADA', usuario: c._id, ruta: ruta._id,
        titulo: '✅ El camión llegó a tu zona',
        mensaje: `El camión de "${ruta.nombre}" está a ${Math.round(d)} m de tu ubicación. ¡Saca tus residuos ahora!`,
      });
      ya.add(key('LLEGADA'));
    } else if (d <= UMBRAL_PROXIMO && !ya.has(key('PROXIMIDAD')) && !ya.has(key('LLEGADA'))) {
      const etaMin = Math.max(1, Math.round((d / 1000 / kmh) * 60));
      nuevas.push({
        tipo: 'PROXIMIDAD', usuario: c._id, ruta: ruta._id,
        titulo: '🔔 El camión está próximo',
        mensaje: `El camión de "${ruta.nombre}" llega en ~${etaMin} min (${Math.round(d)} m). Ve preparando tus residuos.`,
      });
      ya.add(key('PROXIMIDAD'));
    } else if (d >= UMBRAL_PASO && ya.has(key('LLEGADA')) && !ya.has(key('PASO'))) {
      nuevas.push({
        tipo: 'PASO', usuario: c._id, ruta: ruta._id,
        titulo: '⏭️ El camión ya pasó',
        mensaje: `El camión de "${ruta.nombre}" ya pasó por tu zona. Espera la próxima recolección.`,
      });
      ya.add(key('PASO'));
    }
  }

  if (nuevas.length) await Alerta.insertMany(nuevas);
  return nuevas.length;
}

// ETA en minutos del camión hasta un punto dado
export async function etaHasta(ruta, lat, lng) {
  if (ruta.latitudActual == null || lat == null) return null;
  const d = distanciaMetros(ruta.latitudActual, ruta.longitudActual, lat, lng);
  const kmh = await velocidadEstimada(ruta._id);
  return { distanciaM: Math.round(d), etaMin: Math.max(1, Math.round((d / 1000 / kmh) * 60)), velocidadKmh: Math.round(kmh) };
}

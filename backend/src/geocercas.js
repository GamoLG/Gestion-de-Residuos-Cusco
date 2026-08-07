// Proyecto realizado por el estudiante Jhoel Alex Luicho Quispe, estudiante de la Escuela Profesional de Ingeniería Informática y de Sistemas - UNSAAC.
import Usuario from './models/Usuario.js';
import Alerta from './models/Alerta.js';
import TrazaGPS from './models/TrazaGPS.js';
import Horario from './models/Horario.js';
import Ruta from './models/Ruta.js';
import { enviarPush } from './push.js';

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

// Hora actual en Cusco (America/Lima, UTC-5 fijo, sin horario de verano) —
// el servidor (Render) corre en UTC, así que NO se puede usar new Date().getDay()/getHours() directo.
const DIA_A_NUM = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
export function ahoraCusco() {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Lima', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date());
  const m = Object.fromEntries(partes.map((p) => [p.type, p.value]));
  const hora = parseInt(m.hour, 10) % 24;
  const minuto = parseInt(m.minute, 10);
  return { diaSemana: DIA_A_NUM[m.weekday], minutosDelDia: hora * 60 + minuto, hora, minuto };
}

// 00:00 de "hoy" en Cusco, expresado como instante UTC (para filtrar createdAt >= hoy)
export function inicioDeHoyCusco() {
  const OFFSET_MS = 5 * 3600 * 1000; // Lima = UTC-5
  const lima = new Date(Date.now() - OFFSET_MS);
  const inicioLima = Date.UTC(lima.getUTCFullYear(), lima.getUTCMonth(), lima.getUTCDate(), 0, 0, 0);
  return new Date(inicioLima + OFFSET_MS);
}

function minutosDe(hhmm) {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

// Horarios activos de una zona para el día de hoy (en Cusco), ordenados por hora
async function horariosDeHoy(zonaId) {
  const { diaSemana } = ahoraCusco();
  return Horario.find({ zona: zonaId, diaSemana, activo: true }).sort('hora');
}

function textoVentana(h) {
  const rango = h.horaFin ? `${h.hora}–${h.horaFin}` : `${h.hora}`;
  return h.sector ? `${h.sector} (${rango})` : rango;
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
const UMBRAL_LLEGO = 200; // m — "el camión llegó" (radio del punto de recojo)
const UMBRAL_PASO = 600; // m — se alejó tras haber llegado ⇒ "ya no está"

// Evalúa geocercas: crea avisos PROXIMIDAD / LLEGADA / PASO para los ciudadanos
// de la zona de la ruta, según su distancia PERSONAL al camión (cada ciudadano
// tiene su propia ubicación). Devuelve cuántos avisos generó.
export async function evaluarGeocercas(ruta) {
  if (!ruta?.zona || ruta.latitudActual == null || ruta.longitudActual == null) return 0;

  const ciudadanos = await Usuario.find({
    rol: 'CIUDADANO',
    activo: true,
    zona: ruta.zona,
    latitud: { $ne: null },
    longitud: { $ne: null },
  }).select('nombre latitud longitud pushToken');
  if (!ciudadanos.length) return 0;
  const pushDe = Object.fromEntries(ciudadanos.map((c) => [String(c._id), c.pushToken]));

  const desde = ruta.fechaInicio || new Date(Date.now() - 12 * 3600 * 1000);
  // Avisos ya emitidos en esta jornada (para no repetir)
  const previas = await Alerta.find({
    ruta: ruta._id,
    createdAt: { $gte: desde },
    tipo: { $in: ['PROXIMIDAD', 'LLEGADA', 'PASO'] },
  }).select('usuario tipo');
  const ya = new Set(previas.map((a) => `${a.usuario}:${a.tipo}`));

  const kmh = await velocidadEstimada(ruta._id);
  const horariosHoy = await horariosDeHoy(ruta.zona);
  const contexto = horariosHoy.length ? ` Horario previsto: ${horariosHoy.map(textoVentana).join(' · ')}.` : '';
  const nuevas = [];

  for (const c of ciudadanos) {
    const d = distanciaMetros(ruta.latitudActual, ruta.longitudActual, c.latitud, c.longitud);
    const key = (t) => `${c._id}:${t}`;

    if (d <= UMBRAL_LLEGO && !ya.has(key('LLEGADA'))) {
      nuevas.push({
        tipo: 'LLEGADA', usuario: c._id, ruta: ruta._id, zona: ruta.zona,
        titulo: '✅ El camión llegó a tu punto de recojo',
        mensaje: `El camión de "${ruta.nombre}" está a ${Math.round(d)} m de tu ubicación. ¡Saca tus residuos ahora!${contexto}`,
      });
      ya.add(key('LLEGADA'));
    } else if (d <= UMBRAL_PROXIMO && !ya.has(key('PROXIMIDAD')) && !ya.has(key('LLEGADA'))) {
      const etaMin = Math.max(1, Math.round((d / 1000 / kmh) * 60));
      nuevas.push({
        tipo: 'PROXIMIDAD', usuario: c._id, ruta: ruta._id, zona: ruta.zona,
        titulo: '🔔 El camión está próximo',
        mensaje: `El camión de "${ruta.nombre}" llega en ~${etaMin} min (${Math.round(d)} m). Ve preparando tus residuos.${contexto}`,
      });
      ya.add(key('PROXIMIDAD'));
    } else if (d >= UMBRAL_PASO && ya.has(key('LLEGADA')) && !ya.has(key('PASO'))) {
      nuevas.push({
        tipo: 'PASO', usuario: c._id, ruta: ruta._id, zona: ruta.zona,
        titulo: '⏭️ El camión ya no está en tu punto',
        mensaje: `El camión de "${ruta.nombre}" ya pasó por tu punto de recojo. Si no sacaste tus residuos a tiempo, espera la próxima recolección.`,
      });
      ya.add(key('PASO'));
    }
  }

  if (nuevas.length) {
    await Alerta.insertMany(nuevas);
    // Notificación push real (con sonido, aunque la app esté cerrada). No se
    // espera la respuesta de Expo para no demorar el PUT de ubicación del camión.
    enviarPush(
      nuevas.map((a) => ({
        to: pushDe[String(a.usuario)],
        title: a.titulo,
        body: a.mensaje,
        data: { tipo: a.tipo, rutaId: String(a.ruta) },
      }))
    ).catch(() => {});
  }
  return nuevas.length;
}

// ETA en minutos del camión hasta un punto dado
export async function etaHasta(ruta, lat, lng) {
  if (ruta.latitudActual == null || lat == null) return null;
  const d = distanciaMetros(ruta.latitudActual, ruta.longitudActual, lat, lng);
  const kmh = await velocidadEstimada(ruta._id);
  return { distanciaM: Math.round(d), etaMin: Math.max(1, Math.round((d / 1000 / kmh) * 60)), velocidadKmh: Math.round(kmh) };
}

// Revisión periódica de RETRASOS: si el horario de hoy de una zona ya cerró su
// ventana (horaFin + margen) y ningún camión llegó a esa zona hoy, avisa a sus
// ciudadanos. Se llama desde un temporizador en server.js (no depende del GPS).
const MARGEN_MIN = 20; // minutos de gracia tras el fin de la ventana
const LIMITE_MIN = 24 * 60; // no seguir avisando pasado un día completo
export async function revisarRetrasos() {
  const { diaSemana, minutosDelDia } = ahoraCusco();
  const horarios = await Horario.find({ diaSemana, activo: true, horaFin: { $ne: null } });
  if (!horarios.length) return 0;

  const inicioHoy = inicioDeHoyCusco();
  let generadas = 0;

  for (const h of horarios) {
    const finMin = minutosDe(h.horaFin);
    if (finMin == null) continue;
    const retrasoMin = minutosDelDia - (finMin + MARGEN_MIN);
    if (retrasoMin < 0 || retrasoMin > LIMITE_MIN) continue; // aún no vence, o ya pasó demasiado tiempo

    // ¿ya avisamos un retraso de esta zona hoy? (uno por zona/día, evita spam)
    const yaAvisado = await Alerta.exists({ tipo: 'RETRASO', zona: h.zona, createdAt: { $gte: inicioHoy } });
    if (yaAvisado) continue;

    // ¿algún camión llegó (LLEGADA) a esta zona hoy?
    const rutasZona = await Ruta.find({ zona: h.zona }).select('_id');
    const rutaIds = rutasZona.map((r) => r._id);
    const yaLlego = rutaIds.length
      ? await Alerta.exists({ tipo: 'LLEGADA', ruta: { $in: rutaIds }, createdAt: { $gte: inicioHoy } })
      : false;
    if (yaLlego) continue;

    const ciudadanos = await Usuario.find({ rol: 'CIUDADANO', activo: true, zona: h.zona }).select('_id pushToken');
    if (!ciudadanos.length) continue;

    const titulo = '⚠️ Retraso en tu ruta de recojo';
    const mensaje = `El camión no llegó dentro del horario previsto de ${textoVentana(h)}. Puede haber un retraso o reprogramación; te avisaremos apenas esté cerca.`;
    const nuevas = ciudadanos.map((c) => ({ tipo: 'RETRASO', usuario: c._id, zona: h.zona, titulo, mensaje }));
    await Alerta.insertMany(nuevas);
    generadas += nuevas.length;
    enviarPush(
      ciudadanos.map((c) => ({ to: c.pushToken, title: titulo, body: mensaje, data: { tipo: 'RETRASO' } }))
    ).catch(() => {});
  }
  return generadas;
}

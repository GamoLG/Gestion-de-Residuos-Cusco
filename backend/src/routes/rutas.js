import { Router } from 'express';
import Ruta from '../models/Ruta.js';
import TrazaGPS from '../models/TrazaGPS.js';
import Usuario from '../models/Usuario.js';
import { auditar } from '../models/Auditoria.js';
import { evaluarGeocercas, etaHasta } from '../geocercas.js';
import { autenticar, permitir } from '../middleware/auth.js';
import { ok, fail } from '../utils.js';

const router = Router();
const OPER = ['OPERADOR_CAMION', 'ADMIN_ZONA', 'ADMIN_MUNICIPAL', 'SUPER_ADMIN'];
const ADMIN = ['ADMIN_ZONA', 'ADMIN_MUNICIPAL', 'SUPER_ADMIN'];

// GET /api/rutas
router.get('/', async (_req, res) => {
  const rutas = await Ruta.find().populate('zona operador', 'nombre color placa').sort('-createdAt');
  return ok(res, rutas);
});

// GET /api/rutas/activas  (en progreso — para seguimiento en vivo)
router.get('/activas', async (_req, res) => {
  const rutas = await Ruta.find({ estado: 'EN_PROGRESO' }).populate('zona operador', 'nombre color');
  return ok(res, rutas);
});

// GET /api/rutas/mias  (operador: sus rutas asignadas)
router.get('/mias', autenticar, permitir(...OPER), async (req, res) => {
  const rutas = await Ruta.find({ operador: req.usuario.id }).populate('zona', 'nombre color').sort('-createdAt');
  return ok(res, rutas);
});

// GET /api/rutas/:id
router.get('/:id', async (req, res) => {
  const ruta = await Ruta.findById(req.params.id).populate('zona operador', 'nombre color');
  if (!ruta) return fail(res, 'Ruta no encontrada', 404);
  return ok(res, ruta);
});

// GET /api/rutas/:id/traza  — recorrido real del camión (para la polilínea)
router.get('/:id/traza', async (req, res) => {
  const trazas = await TrazaGPS.find({ ruta: req.params.id }).sort('createdAt').limit(500).select('latitud longitud createdAt');
  return ok(res, trazas);
});

// GET /api/rutas/:id/eta?lat=&lng=  — ETA del camión hasta un punto (IA simple)
router.get('/:id/eta', autenticar, async (req, res) => {
  const ruta = await Ruta.findById(req.params.id);
  if (!ruta) return fail(res, 'Ruta no encontrada', 404);
  let lat = parseFloat(req.query.lat);
  let lng = parseFloat(req.query.lng);
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    const u = await Usuario.findById(req.usuario.id);
    lat = u?.latitud; lng = u?.longitud;
  }
  if (lat == null || lng == null) return fail(res, 'No hay ubicación de referencia');
  const eta = await etaHasta(ruta, lat, lng);
  if (!eta) return fail(res, 'El camión aún no transmite su ubicación');
  return ok(res, eta);
});

// POST /api/rutas  (admin)
router.post('/', autenticar, permitir(...ADMIN), async (req, res) => {
  const ruta = await Ruta.create(req.body);
  await auditar(req, 'CREAR', 'Ruta', ruta._id, ruta.nombre);
  return ok(res, ruta, 'Ruta creada', 201);
});

// PUT /api/rutas/:id  (admin — editar)
router.put('/:id', autenticar, permitir(...ADMIN), async (req, res) => {
  const ruta = await Ruta.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!ruta) return fail(res, 'Ruta no encontrada', 404);
  await auditar(req, 'EDITAR', 'Ruta', ruta._id, ruta.nombre);
  return ok(res, ruta, 'Ruta actualizada');
});

// DELETE /api/rutas/:id  (admin)
router.delete('/:id', autenticar, permitir('ADMIN_MUNICIPAL', 'SUPER_ADMIN'), async (req, res) => {
  const ruta = await Ruta.findByIdAndDelete(req.params.id);
  if (!ruta) return fail(res, 'Ruta no encontrada', 404);
  await TrazaGPS.deleteMany({ ruta: ruta._id });
  await auditar(req, 'ELIMINAR', 'Ruta', ruta._id, ruta.nombre);
  return ok(res, null, 'Ruta eliminada');
});

// PUT /api/rutas/:id/estado  (operador/admin)
router.put('/:id/estado', autenticar, permitir(...OPER), async (req, res) => {
  const { estado } = req.body;
  const patch = { estado };
  if (estado === 'EN_PROGRESO') patch.fechaInicio = new Date();
  if (estado === 'COMPLETADA') patch.fechaFin = new Date();
  if (estado === 'PENDIENTE') {
    // reiniciar jornada: limpiar paradas y recorrido anterior
    const r = await Ruta.findById(req.params.id);
    if (r) {
      r.estado = 'PENDIENTE';
      r.paradas.forEach((p) => { p.atendida = false; p.horaAtencion = undefined; });
      r.latitudActual = undefined; r.longitudActual = undefined;
      await r.save();
      await TrazaGPS.deleteMany({ ruta: r._id });
      return ok(res, r, 'Ruta reiniciada');
    }
  }
  const ruta = await Ruta.findByIdAndUpdate(req.params.id, patch, { new: true });
  if (!ruta) return fail(res, 'Ruta no encontrada', 404);
  if (estado === 'EN_PROGRESO') await TrazaGPS.deleteMany({ ruta: ruta._id }); // jornada nueva, traza nueva
  return ok(res, ruta, 'Estado actualizado');
});

// PUT /api/rutas/:id/ubicacion  (operador/admin) — seguimiento GPS en vivo
// Guarda la traza, y evalúa geocercas para avisar a los ciudadanos (próximo/llegó/pasó)
router.put('/:id/ubicacion', autenticar, permitir(...OPER), async (req, res) => {
  const { latitud, longitud } = req.body;
  if (typeof latitud !== 'number' || typeof longitud !== 'number') return fail(res, 'latitud y longitud son requeridas');
  const ruta = await Ruta.findByIdAndUpdate(
    req.params.id,
    { latitudActual: latitud, longitudActual: longitud, ultimaActualizacion: new Date() },
    { new: true }
  );
  if (!ruta) return fail(res, 'Ruta no encontrada', 404);

  await TrazaGPS.create({ ruta: ruta._id, latitud, longitud });
  let avisos = 0;
  try { avisos = await evaluarGeocercas(ruta); } catch (e) { console.error('geocercas', e.message); }
  return ok(res, { ruta, avisosGenerados: avisos }, 'Ubicación actualizada');
});

// PUT /api/rutas/:id/paradas/:idx  (operador/admin) — marcar parada atendida
router.put('/:id/paradas/:idx', autenticar, permitir(...OPER), async (req, res) => {
  const ruta = await Ruta.findById(req.params.id);
  if (!ruta) return fail(res, 'Ruta no encontrada', 404);
  const idx = parseInt(req.params.idx, 10);
  if (!(idx >= 0 && idx < ruta.paradas.length)) return fail(res, 'Parada inválida');
  const atendida = req.body.atendida !== false;
  ruta.paradas[idx].atendida = atendida;
  ruta.paradas[idx].horaAtencion = atendida ? new Date() : undefined;
  await ruta.save();
  return ok(res, ruta, atendida ? 'Parada marcada como atendida' : 'Parada desmarcada');
});

export default router;

import { Router } from 'express';
import Ruta from '../models/Ruta.js';
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

// GET /api/rutas/:id
router.get('/:id', async (req, res) => {
  const ruta = await Ruta.findById(req.params.id).populate('zona operador', 'nombre color');
  if (!ruta) return fail(res, 'Ruta no encontrada', 404);
  return ok(res, ruta);
});

// POST /api/rutas  (admin)
router.post('/', autenticar, permitir(...ADMIN), async (req, res) => {
  const ruta = await Ruta.create(req.body);
  return ok(res, ruta, 'Ruta creada', 201);
});

// PUT /api/rutas/:id/estado  (operador/admin)
router.put('/:id/estado', autenticar, permitir(...OPER), async (req, res) => {
  const { estado } = req.body;
  const patch = { estado };
  if (estado === 'EN_PROGRESO') patch.fechaInicio = new Date();
  if (estado === 'COMPLETADA') patch.fechaFin = new Date();
  const ruta = await Ruta.findByIdAndUpdate(req.params.id, patch, { new: true });
  if (!ruta) return fail(res, 'Ruta no encontrada', 404);
  return ok(res, ruta, 'Estado actualizado');
});

// PUT /api/rutas/:id/ubicacion  (operador/admin) — seguimiento GPS en vivo
router.put('/:id/ubicacion', autenticar, permitir(...OPER), async (req, res) => {
  const { latitud, longitud } = req.body;
  const ruta = await Ruta.findByIdAndUpdate(
    req.params.id,
    { latitudActual: latitud, longitudActual: longitud, ultimaActualizacion: new Date() },
    { new: true }
  );
  if (!ruta) return fail(res, 'Ruta no encontrada', 404);
  return ok(res, ruta, 'Ubicación actualizada');
});

export default router;

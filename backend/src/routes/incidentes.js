import { Router } from 'express';
import Incidente from '../models/Incidente.js';
import { auditar } from '../models/Auditoria.js';
import { zonaDesdePunto } from './auth.js';
import { autenticar, permitir } from '../middleware/auth.js';
import { ok, fail } from '../utils.js';

const router = Router();
const ADMIN = ['ADMIN_ZONA', 'ADMIN_MUNICIPAL', 'SUPER_ADMIN'];

// GET /api/incidentes  (admin: todos)
router.get('/', autenticar, permitir(...ADMIN), async (_req, res) => {
  const items = await Incidente.find().populate('usuario zona', 'nombre').sort('-createdAt');
  return ok(res, items);
});

// GET /api/incidentes/puntos  — coordenadas para el mapa de calor de zonas críticas
// (cualquier usuario autenticado; pendientes pesan más que resueltas)
router.get('/puntos', autenticar, async (_req, res) => {
  const items = await Incidente.find({ latitud: { $ne: null }, longitud: { $ne: null } })
    .select('latitud longitud estado')
    .sort('-createdAt')
    .limit(500);
  const peso = { PENDIENTE: 1, EN_PROCESO: 0.6, RESUELTO: 0.25 };
  return ok(res, items.map((i) => ({ lat: i.latitud, lng: i.longitud, peso: peso[i.estado] ?? 0.5 })));
});

// GET /api/incidentes/mis-reportes
router.get('/mis-reportes', autenticar, async (req, res) => {
  const items = await Incidente.find({ usuario: req.usuario.id }).sort('-createdAt');
  return ok(res, items);
});

// POST /api/incidentes  (ciudadano autenticado)
router.post('/', autenticar, async (req, res) => {
  const { tipo, descripcion, latitud, longitud, foto, zona } = req.body;
  if (!descripcion) return fail(res, 'La descripción es obligatoria');
  let zonaFinal = zona || null;
  if (!zonaFinal && typeof latitud === 'number' && typeof longitud === 'number') {
    const z = await zonaDesdePunto(latitud, longitud);
    zonaFinal = z?._id || null;
  }
  const inc = await Incidente.create({
    tipo, descripcion, latitud, longitud, foto, zona: zonaFinal, usuario: req.usuario.id,
  });
  return ok(res, inc, 'Incidente reportado', 201);
});

// PUT /api/incidentes/:id/estado  (admin)
router.put('/:id/estado', autenticar, permitir(...ADMIN), async (req, res) => {
  const inc = await Incidente.findByIdAndUpdate(req.params.id, { estado: req.body.estado }, { new: true });
  if (!inc) return fail(res, 'Incidente no encontrado', 404);
  await auditar(req, 'EDITAR', 'Incidente', inc._id, `estado → ${inc.estado}`);
  return ok(res, inc, 'Estado actualizado');
});

// DELETE /api/incidentes/:id  (admin)
router.delete('/:id', autenticar, permitir('ADMIN_MUNICIPAL', 'SUPER_ADMIN'), async (req, res) => {
  await Incidente.findByIdAndDelete(req.params.id);
  await auditar(req, 'ELIMINAR', 'Incidente', req.params.id);
  return ok(res, null, 'Incidente eliminado');
});

export default router;

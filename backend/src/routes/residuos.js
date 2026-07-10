import { Router } from 'express';
import Residuo from '../models/Residuo.js';
import { auditar } from '../models/Auditoria.js';
import { autenticar, permitir } from '../middleware/auth.js';
import { ok, fail } from '../utils.js';

const router = Router();
const ADMIN = ['ADMIN_ZONA', 'ADMIN_MUNICIPAL', 'SUPER_ADMIN'];

// GET /api/residuos  (catálogo de tipos — guía de segregación, público)
router.get('/', async (_req, res) => {
  const items = await Residuo.find({ activo: true }).sort('categoria nombre');
  return ok(res, items);
});

// POST /api/residuos  (admin)
router.post('/', autenticar, permitir(...ADMIN), async (req, res) => {
  const r = await Residuo.create(req.body);
  await auditar(req, 'CREAR', 'Residuo', r._id, r.nombre);
  return ok(res, r, 'Tipo de residuo creado', 201);
});

// POST /api/residuos/recoleccion  (admin/operador) — registrar kg recolectados
router.post('/recoleccion', autenticar, permitir('OPERADOR_CAMION', ...ADMIN), async (req, res) => {
  const { zona, categoria, pesoKg, nombre } = req.body;
  if (!pesoKg || pesoKg <= 0) return fail(res, 'pesoKg debe ser mayor a 0');
  const hoy = new Date();
  const r = await Residuo.create({
    nombre: nombre || `Recolección ${categoria || ''}`.trim(),
    categoria: categoria || 'NO_RECICLABLE',
    zona: zona || null, pesoKg,
    mes: hoy.getMonth() + 1, anio: hoy.getFullYear(),
    activo: false, // no aparece en el catálogo, solo en reportes
  });
  return ok(res, r, 'Recolección registrada', 201);
});

// PUT /api/residuos/:id  (admin)
router.put('/:id', autenticar, permitir(...ADMIN), async (req, res) => {
  const r = await Residuo.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!r) return fail(res, 'Residuo no encontrado', 404);
  await auditar(req, 'EDITAR', 'Residuo', r._id, r.nombre);
  return ok(res, r, 'Residuo actualizado');
});

// DELETE /api/residuos/:id  (admin)
router.delete('/:id', autenticar, permitir('ADMIN_MUNICIPAL', 'SUPER_ADMIN'), async (req, res) => {
  const r = await Residuo.findByIdAndDelete(req.params.id);
  if (!r) return fail(res, 'Residuo no encontrado', 404);
  await auditar(req, 'ELIMINAR', 'Residuo', r._id, r.nombre);
  return ok(res, null, 'Residuo eliminado');
});

// GET /api/residuos/reportes  (admin) — volumen recolectado por zona
router.get('/reportes', autenticar, permitir(...ADMIN), async (_req, res) => {
  const porZona = await Residuo.aggregate([
    { $match: { pesoKg: { $gt: 0 } } },
    { $group: { _id: '$zona', totalKg: { $sum: '$pesoKg' } } },
  ]);
  const porCategoria = await Residuo.aggregate([
    { $match: { pesoKg: { $gt: 0 } } },
    { $group: { _id: '$categoria', totalKg: { $sum: '$pesoKg' } } },
  ]);
  return ok(res, { porZona, porCategoria });
});

export default router;

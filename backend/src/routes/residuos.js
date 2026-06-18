import { Router } from 'express';
import Residuo from '../models/Residuo.js';
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
  return ok(res, r, 'Tipo de residuo creado', 201);
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

import { Router } from 'express';
import Zona from '../models/Zona.js';
import { autenticar, permitir } from '../middleware/auth.js';
import { ok, fail } from '../utils.js';

const router = Router();

// GET /api/zonas  (público)
router.get('/', async (_req, res) => {
  const zonas = await Zona.find({ activo: true }).sort('nombre');
  return ok(res, zonas);
});

// POST /api/zonas/detect  (público — usado en el registro)
router.post('/detect', async (req, res) => {
  const { lat, lng } = req.body;
  if (typeof lat !== 'number' || typeof lng !== 'number') return fail(res, 'lat y lng son requeridos');
  const zona = await Zona.findOne({
    activo: true,
    geometry: { $geoIntersects: { $geometry: { type: 'Point', coordinates: [lng, lat] } } },
  });
  return ok(res, {
    matched: !!zona,
    zona: zona ? { id: zona._id, nombre: zona.nombre, color: zona.color, distrito: zona.distrito } : null,
  }, zona ? 'Zona detectada' : 'Sin zona para esta ubicación');
});

// POST /api/zonas  (admin)
router.post('/', autenticar, permitir('ADMIN_ZONA', 'ADMIN_MUNICIPAL', 'SUPER_ADMIN'), async (req, res) => {
  const zona = await Zona.create(req.body);
  return ok(res, zona, 'Zona creada', 201);
});

// PUT /api/zonas/:id  (admin)
router.put('/:id', autenticar, permitir('ADMIN_ZONA', 'ADMIN_MUNICIPAL', 'SUPER_ADMIN'), async (req, res) => {
  const zona = await Zona.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!zona) return fail(res, 'Zona no encontrada', 404);
  return ok(res, zona, 'Zona actualizada');
});

export default router;

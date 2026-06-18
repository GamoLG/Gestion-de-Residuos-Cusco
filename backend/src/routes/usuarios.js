import { Router } from 'express';
import Usuario from '../models/Usuario.js';
import { autenticar, permitir } from '../middleware/auth.js';
import { ok, fail } from '../utils.js';

const router = Router();
const ADMIN = ['ADMIN_ZONA', 'ADMIN_MUNICIPAL', 'SUPER_ADMIN'];

// GET /api/usuarios  (admin)
router.get('/', autenticar, permitir(...ADMIN), async (_req, res) => {
  const items = await Usuario.find().populate('zona', 'nombre').sort('-createdAt');
  return ok(res, items);
});

// GET /api/usuarios/operadores  (admin) — para asignar a rutas
router.get('/operadores', autenticar, permitir(...ADMIN), async (_req, res) => {
  const items = await Usuario.find({ rol: 'OPERADOR_CAMION', activo: true }).select('nombre email');
  return ok(res, items);
});

// PUT /api/usuarios/:id/zona/:zonaId  (admin) — asignar zona
router.put('/:id/zona/:zonaId', autenticar, permitir(...ADMIN), async (req, res) => {
  const u = await Usuario.findByIdAndUpdate(req.params.id, { zona: req.params.zonaId }, { new: true });
  if (!u) return fail(res, 'Usuario no encontrado', 404);
  return ok(res, u, 'Zona asignada');
});

export default router;

import { Router } from 'express';
import Horario from '../models/Horario.js';
import { auditar } from '../models/Auditoria.js';
import { autenticar, permitir } from '../middleware/auth.js';
import { ok, fail } from '../utils.js';

const router = Router();
const ADMIN = ['ADMIN_ZONA', 'ADMIN_MUNICIPAL', 'SUPER_ADMIN'];

// GET /api/horarios?zona=<id>  (público — horario de recojo)
router.get('/', async (req, res) => {
  const filtro = { activo: true };
  if (req.query.zona) filtro.zona = req.query.zona;
  const items = await Horario.find(filtro).populate('zona', 'nombre color').sort('diaSemana hora');
  return ok(res, items);
});

// POST /api/horarios  (admin)
router.post('/', autenticar, permitir(...ADMIN), async (req, res) => {
  const { zona, diaSemana, hora } = req.body;
  if (!zona || diaSemana == null || !hora) return fail(res, 'zona, diaSemana y hora son requeridos');
  const h = await Horario.create(req.body);
  await auditar(req, 'CREAR', 'Horario', h._id, `día ${diaSemana} ${hora}`);
  return ok(res, h, 'Horario creado', 201);
});

// PUT /api/horarios/:id  (admin)
router.put('/:id', autenticar, permitir(...ADMIN), async (req, res) => {
  const h = await Horario.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!h) return fail(res, 'Horario no encontrado', 404);
  await auditar(req, 'EDITAR', 'Horario', h._id);
  return ok(res, h, 'Horario actualizado');
});

// DELETE /api/horarios/:id  (admin)
router.delete('/:id', autenticar, permitir(...ADMIN), async (req, res) => {
  const h = await Horario.findByIdAndDelete(req.params.id);
  if (!h) return fail(res, 'Horario no encontrado', 404);
  await auditar(req, 'ELIMINAR', 'Horario', h._id);
  return ok(res, null, 'Horario eliminado');
});

export default router;

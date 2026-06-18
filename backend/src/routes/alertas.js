import { Router } from 'express';
import Alerta from '../models/Alerta.js';
import { autenticar } from '../middleware/auth.js';
import { ok } from '../utils.js';

const router = Router();

// GET /api/alertas/mias
router.get('/mias', autenticar, async (req, res) => {
  const items = await Alerta.find({ usuario: req.usuario.id }).sort('-createdAt').limit(100);
  return ok(res, items);
});

// PUT /api/alertas/:id/leida
router.put('/:id/leida', autenticar, async (req, res) => {
  await Alerta.findOneAndUpdate({ _id: req.params.id, usuario: req.usuario.id }, { leida: true });
  return ok(res, null, 'Marcada como leída');
});

// PUT /api/alertas/leer-todas
router.put('/leer-todas', autenticar, async (req, res) => {
  await Alerta.updateMany({ usuario: req.usuario.id, leida: false }, { leida: true });
  return ok(res, null, 'Todas marcadas como leídas');
});

export default router;

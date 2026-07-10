import { Router } from 'express';
import Auditoria from '../models/Auditoria.js';
import { autenticar, permitir } from '../middleware/auth.js';
import { ok } from '../utils.js';

const router = Router();

// GET /api/auditoria  (admin) — últimas 200 acciones
router.get('/', autenticar, permitir('ADMIN_ZONA', 'ADMIN_MUNICIPAL', 'SUPER_ADMIN'), async (_req, res) => {
  const items = await Auditoria.find().sort('-createdAt').limit(200);
  return ok(res, items);
});

export default router;

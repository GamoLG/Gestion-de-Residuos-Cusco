import { Router } from 'express';
import { ok, fail } from '../utils.js';

const router = Router();

// GET /api/dni/:dni  (público — usado en el registro)
router.get('/:dni', async (req, res) => {
  const { dni } = req.params;
  if (!/^\d{8}$/.test(dni)) return fail(res, 'El DNI debe tener 8 dígitos');
  const token = process.env.DNI_API_TOKEN;
  if (!token) return fail(res, 'Servicio de DNI no configurado', 503);
  try {
    const r = await fetch(`https://dniruc.apisperu.com/api/v1/dni/${dni}?token=${encodeURIComponent(token)}`, {
      signal: AbortSignal.timeout(8000),
    });
    const d = await r.json();
    if (d?.success === false || !d?.nombres) return fail(res, d?.message || 'No se encontraron datos', 404);
    const nombre = `${d.nombres} ${d.apellidoPaterno || ''} ${d.apellidoMaterno || ''}`.trim().replace(/\s+/g, ' ');
    return ok(res, { dni, nombre, nombres: d.nombres, apellidoPaterno: d.apellidoPaterno, apellidoMaterno: d.apellidoMaterno });
  } catch {
    return fail(res, 'No se pudo consultar el DNI', 504);
  }
});

export default router;

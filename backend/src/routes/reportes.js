import { Router } from 'express';
import Usuario from '../models/Usuario.js';
import Zona from '../models/Zona.js';
import Ruta from '../models/Ruta.js';
import Incidente from '../models/Incidente.js';
import Residuo from '../models/Residuo.js';
import { autenticar, permitir } from '../middleware/auth.js';
import { ok } from '../utils.js';

const router = Router();
const ADMIN = ['ADMIN_ZONA', 'ADMIN_MUNICIPAL', 'SUPER_ADMIN'];

// GET /api/reportes/resumen  (admin) — KPIs generales
router.get('/resumen', autenticar, permitir(...ADMIN), async (_req, res) => {
  const [usuarios, ciudadanos, operadores, zonas, rutas, rutasActivas, incidentes, incPendientes, kg] =
    await Promise.all([
      Usuario.countDocuments(),
      Usuario.countDocuments({ rol: 'CIUDADANO' }),
      Usuario.countDocuments({ rol: 'OPERADOR_CAMION' }),
      Zona.countDocuments({ activo: true }),
      Ruta.countDocuments(),
      Ruta.countDocuments({ estado: 'EN_PROGRESO' }),
      Incidente.countDocuments(),
      Incidente.countDocuments({ estado: 'PENDIENTE' }),
      Residuo.aggregate([{ $match: { pesoKg: { $gt: 0 } } }, { $group: { _id: null, t: { $sum: '$pesoKg' } } }]),
    ]);
  return ok(res, {
    usuarios, ciudadanos, operadores, zonas, rutas, rutasActivas,
    incidentes, incPendientes, totalKg: kg[0]?.t || 0,
  });
});

// GET /api/reportes/recolectado  (admin) — kg por zona y por categoría
router.get('/recolectado', autenticar, permitir(...ADMIN), async (_req, res) => {
  const porZona = await Residuo.aggregate([
    { $match: { pesoKg: { $gt: 0 } } },
    { $group: { _id: '$zona', totalKg: { $sum: '$pesoKg' } } },
    { $lookup: { from: 'zonas', localField: '_id', foreignField: '_id', as: 'z' } },
    { $project: { totalKg: 1, zona: { $ifNull: [{ $arrayElemAt: ['$z.nombre', 0] }, 'Sin zona'] } } },
    { $sort: { totalKg: -1 } },
  ]);
  const porCategoria = await Residuo.aggregate([
    { $match: { pesoKg: { $gt: 0 } } },
    { $group: { _id: '$categoria', totalKg: { $sum: '$pesoKg' } } },
    { $sort: { totalKg: -1 } },
  ]);
  const porMes = await Residuo.aggregate([
    { $match: { pesoKg: { $gt: 0 }, mes: { $ne: null } } },
    { $group: { _id: { anio: '$anio', mes: '$mes' }, totalKg: { $sum: '$pesoKg' } } },
    { $sort: { '_id.anio': 1, '_id.mes': 1 } },
  ]);
  return ok(res, { porZona, porCategoria, porMes });
});

// GET /api/reportes/incidencias  (admin) — por zona, tipo y estado
router.get('/incidencias', autenticar, permitir(...ADMIN), async (_req, res) => {
  const porZona = await Incidente.aggregate([
    { $group: { _id: '$zona', total: { $sum: 1 }, pendientes: { $sum: { $cond: [{ $eq: ['$estado', 'PENDIENTE'] }, 1, 0] } } } },
    { $lookup: { from: 'zonas', localField: '_id', foreignField: '_id', as: 'z' } },
    { $project: { total: 1, pendientes: 1, zona: { $ifNull: [{ $arrayElemAt: ['$z.nombre', 0] }, 'Sin zona'] } } },
    { $sort: { total: -1 } },
  ]);
  const porTipo = await Incidente.aggregate([{ $group: { _id: '$tipo', total: { $sum: 1 } } }, { $sort: { total: -1 } }]);
  const porEstado = await Incidente.aggregate([{ $group: { _id: '$estado', total: { $sum: 1 } } }]);
  return ok(res, { porZona, porTipo, porEstado });
});

// GET /api/reportes/cumplimiento  (admin) — rutas planificadas vs ejecutadas
router.get('/cumplimiento', autenticar, permitir(...ADMIN), async (_req, res) => {
  const rutas = await Ruta.find().populate('zona operador', 'nombre');
  const detalle = rutas.map((r) => {
    const total = r.paradas.length;
    const atendidas = r.paradas.filter((p) => p.atendida).length;
    return {
      id: r._id, nombre: r.nombre, zona: r.zona?.nombre || '—', operador: r.operador?.nombre || '—',
      estado: r.estado, paradasTotal: total, paradasAtendidas: atendidas,
      cumplimiento: total ? Math.round((atendidas / total) * 100) : 0,
      fechaInicio: r.fechaInicio, fechaFin: r.fechaFin,
    };
  });
  const porEstado = {};
  for (const r of rutas) porEstado[r.estado] = (porEstado[r.estado] || 0) + 1;
  return ok(res, { detalle, porEstado });
});

// GET /api/reportes/participacion  (admin) — ciudadanía activa
router.get('/participacion', autenticar, permitir(...ADMIN), async (_req, res) => {
  const registrosPorMes = await Usuario.aggregate([
    { $match: { rol: 'CIUDADANO' } },
    { $group: { _id: { anio: { $year: '$createdAt' }, mes: { $month: '$createdAt' } }, total: { $sum: 1 } } },
    { $sort: { '_id.anio': 1, '_id.mes': 1 } },
  ]);
  const reportesPorMes = await Incidente.aggregate([
    { $group: { _id: { anio: { $year: '$createdAt' }, mes: { $month: '$createdAt' } }, total: { $sum: 1 } } },
    { $sort: { '_id.anio': 1, '_id.mes': 1 } },
  ]);
  const topReportadores = await Incidente.aggregate([
    { $group: { _id: '$usuario', total: { $sum: 1 } } },
    { $sort: { total: -1 } }, { $limit: 10 },
    { $lookup: { from: 'usuarios', localField: '_id', foreignField: '_id', as: 'u' } },
    { $project: { total: 1, nombre: { $ifNull: [{ $arrayElemAt: ['$u.nombre', 0] }, 'Anónimo'] } } },
  ]);
  return ok(res, { registrosPorMes, reportesPorMes, topReportadores });
});

// GET /api/reportes/ranking  (PÚBLICO) — distritos/zonas más limpias
// Puntaje: menos incidencias pendientes + más incidencias resueltas + mejor cumplimiento de rutas + participación
router.get('/ranking', async (_req, res) => {
  const zonas = await Zona.find({ activo: true });
  const [incs, rutas, ciudadanos] = await Promise.all([
    Incidente.aggregate([{ $group: { _id: '$zona', total: { $sum: 1 }, resueltas: { $sum: { $cond: [{ $eq: ['$estado', 'RESUELTO'] }, 1, 0] } } } }]),
    Ruta.find().select('zona paradas estado'),
    Usuario.aggregate([{ $match: { rol: 'CIUDADANO' } }, { $group: { _id: '$zona', total: { $sum: 1 } } }]),
  ]);
  const incMap = Object.fromEntries(incs.map((i) => [String(i._id), i]));
  const ciuMap = Object.fromEntries(ciudadanos.map((c) => [String(c._id), c.total]));

  const ranking = zonas.map((z) => {
    const zid = String(z._id);
    const inc = incMap[zid] || { total: 0, resueltas: 0 };
    const rutasZona = rutas.filter((r) => String(r.zona) === zid);
    const paradas = rutasZona.reduce((s, r) => s + r.paradas.length, 0);
    const atendidas = rutasZona.reduce((s, r) => s + r.paradas.filter((p) => p.atendida).length, 0);
    const cumplimiento = paradas ? atendidas / paradas : 0.5;
    const tasaResolucion = inc.total ? inc.resueltas / inc.total : 1;
    const pendientes = inc.total - inc.resueltas;
    // Índice de limpieza 0-100
    const puntaje = Math.round(
      Math.max(0, Math.min(100, 40 * tasaResolucion + 40 * cumplimiento + 20 * Math.max(0, 1 - pendientes / 10)))
    );
    return {
      zona: z.nombre, distrito: z.distrito || z.nombre, color: z.color,
      puntaje, incidencias: inc.total, resueltas: inc.resueltas,
      cumplimiento: Math.round(cumplimiento * 100), ciudadanos: ciuMap[zid] || 0,
    };
  }).sort((a, b) => b.puntaje - a.puntaje);

  return ok(res, ranking);
});

export default router;

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import Usuario, { ROLES } from '../models/Usuario.js';
import { auditar } from '../models/Auditoria.js';
import { autenticar, permitir } from '../middleware/auth.js';
import { ok, fail } from '../utils.js';

const router = Router();
const ADMIN = ['ADMIN_ZONA', 'ADMIN_MUNICIPAL', 'SUPER_ADMIN'];

// ── Perfil propio ────────────────────────────────────────────────────────────

// PUT /api/usuarios/me  — editar mis datos (cualquier usuario)
router.put('/me', autenticar, async (req, res) => {
  const permitido = ['nombre', 'telefono', 'direccion', 'latitud', 'longitud', 'foto', 'zona'];
  const patch = {};
  for (const k of permitido) if (req.body[k] !== undefined) patch[k] = req.body[k];
  const u = await Usuario.findByIdAndUpdate(req.usuario.id, patch, { new: true }).populate('zona', 'nombre');
  if (!u) return fail(res, 'Usuario no encontrado', 404);
  return ok(res, {
    id: u._id, nombre: u.nombre, email: u.email, rol: u.rol, dni: u.dni,
    telefono: u.telefono, direccion: u.direccion, foto: u.foto,
    latitud: u.latitud, longitud: u.longitud,
    zonaId: u.zona?._id || null, zonaNombre: u.zona?.nombre || null,
  }, 'Perfil actualizado');
});

// PUT /api/usuarios/me/password  — cambiar contraseña
router.put('/me/password', autenticar, async (req, res) => {
  const { actual, nueva } = req.body;
  if (!actual || !nueva) return fail(res, 'Contraseña actual y nueva son requeridas');
  if (String(nueva).length < 6) return fail(res, 'La nueva contraseña debe tener al menos 6 caracteres');
  const u = await Usuario.findById(req.usuario.id).select('+password');
  if (!u) return fail(res, 'Usuario no encontrado', 404);
  const coincide = await bcrypt.compare(actual, u.password);
  if (!coincide) return fail(res, 'La contraseña actual no es correcta', 401);
  u.password = await bcrypt.hash(nueva, 10);
  await u.save();
  return ok(res, null, 'Contraseña actualizada');
});

// PUT /api/usuarios/me/ubicacion  — reportar mi posición en vivo (ciudadano/operador)
router.put('/me/ubicacion', autenticar, async (req, res) => {
  const { latitud, longitud } = req.body;
  if (typeof latitud !== 'number' || typeof longitud !== 'number') return fail(res, 'latitud y longitud son requeridas');
  await Usuario.findByIdAndUpdate(req.usuario.id, { latitud, longitud, ubicacionActualizada: new Date() });
  return ok(res, null, 'Ubicación actualizada');
});

// ── Administración (CRUD total) ──────────────────────────────────────────────

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

// GET /api/usuarios/ubicaciones  (admin) — posiciones en vivo de todos (mapa)
router.get('/ubicaciones', autenticar, permitir(...ADMIN), async (_req, res) => {
  const desde = new Date(Date.now() - 30 * 60 * 1000); // últimos 30 min
  const items = await Usuario.find({
    activo: true,
    latitud: { $ne: null },
    longitud: { $ne: null },
  }).select('nombre rol latitud longitud ubicacionActualizada').populate('zona', 'nombre');
  return ok(res, items.map((u) => ({
    id: u._id, nombre: u.nombre, rol: u.rol,
    latitud: u.latitud, longitud: u.longitud,
    enVivo: !!(u.ubicacionActualizada && u.ubicacionActualizada >= desde),
    ubicacionActualizada: u.ubicacionActualizada,
  })));
});

// POST /api/usuarios  (admin — crear usuario con cualquier rol)
router.post('/', autenticar, permitir(...ADMIN), async (req, res) => {
  const { nombre, email, password, rol, dni, telefono, direccion, zona } = req.body;
  if (!nombre || !email || !password) return fail(res, 'Nombre, email y contraseña son obligatorios');
  if (rol && !ROLES.includes(rol)) return fail(res, 'Rol inválido');
  const existe = await Usuario.findOne({ email: String(email).toLowerCase() });
  if (existe) return fail(res, 'El correo ya está registrado', 409);
  const u = await Usuario.create({
    nombre, email, dni, telefono, direccion,
    rol: rol || 'CIUDADANO', zona: zona || null,
    password: await bcrypt.hash(password, 10),
  });
  await auditar(req, 'CREAR', 'Usuario', u._id, `${u.email} (${u.rol})`);
  return ok(res, u, 'Usuario creado', 201);
});

// PUT /api/usuarios/:id  (admin — editar datos/rol/estado)
router.put('/:id', autenticar, permitir(...ADMIN), async (req, res) => {
  const permitido = ['nombre', 'telefono', 'direccion', 'dni', 'rol', 'zona', 'activo'];
  const patch = {};
  for (const k of permitido) if (req.body[k] !== undefined) patch[k] = req.body[k];
  if (patch.rol && !ROLES.includes(patch.rol)) return fail(res, 'Rol inválido');
  if (req.body.password) patch.password = await bcrypt.hash(req.body.password, 10);
  const u = await Usuario.findByIdAndUpdate(req.params.id, patch, { new: true });
  if (!u) return fail(res, 'Usuario no encontrado', 404);
  await auditar(req, 'EDITAR', 'Usuario', u._id, u.email);
  return ok(res, u, 'Usuario actualizado');
});

// PUT /api/usuarios/:id/zona/:zonaId  (admin) — asignar zona
router.put('/:id/zona/:zonaId', autenticar, permitir(...ADMIN), async (req, res) => {
  const u = await Usuario.findByIdAndUpdate(req.params.id, { zona: req.params.zonaId }, { new: true });
  if (!u) return fail(res, 'Usuario no encontrado', 404);
  await auditar(req, 'EDITAR', 'Usuario', u._id, 'asignación de zona');
  return ok(res, u, 'Zona asignada');
});

// DELETE /api/usuarios/:id  (admin municipal/super)
router.delete('/:id', autenticar, permitir('ADMIN_MUNICIPAL', 'SUPER_ADMIN'), async (req, res) => {
  if (req.params.id === req.usuario.id) return fail(res, 'No puedes eliminar tu propia cuenta');
  const u = await Usuario.findByIdAndDelete(req.params.id);
  if (!u) return fail(res, 'Usuario no encontrado', 404);
  await auditar(req, 'ELIMINAR', 'Usuario', u._id, u.email);
  return ok(res, null, 'Usuario eliminado');
});

export default router;

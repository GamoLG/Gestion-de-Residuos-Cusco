import { Router } from 'express';
import bcrypt from 'bcryptjs';
import Usuario from '../models/Usuario.js';
import Zona from '../models/Zona.js';
import Alerta from '../models/Alerta.js';
import { firmarToken, autenticar } from '../middleware/auth.js';
import { ok, fail } from '../utils.js';

const router = Router();

function zonaDesdePunto(lat, lng) {
  if (typeof lat !== 'number' || typeof lng !== 'number') return Promise.resolve(null);
  return Zona.findOne({
    activo: true,
    geometry: { $geoIntersects: { $geometry: { type: 'Point', coordinates: [lng, lat] } } },
  });
}

function perfil(u) {
  return {
    id: u._id,
    nombre: u.nombre,
    email: u.email,
    rol: u.rol,
    dni: u.dni,
    telefono: u.telefono,
    direccion: u.direccion,
    latitud: u.latitud,
    longitud: u.longitud,
    zonaId: u.zona?._id || u.zona || null,
    zonaNombre: u.zona?.nombre || null,
  };
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { nombre, email, password, dni, telefono, direccion, latitud, longitud, zonaId } = req.body;
    if (!nombre || !email || !password) return fail(res, 'Nombre, email y contraseña son obligatorios');
    if (String(password).length < 6) return fail(res, 'La contraseña debe tener al menos 6 caracteres');

    const existe = await Usuario.findOne({ email: String(email).toLowerCase() });
    if (existe) return fail(res, 'El correo ya está registrado', 409);

    let zonaFinal = zonaId || null;
    if (!zonaFinal) {
      const z = await zonaDesdePunto(latitud, longitud);
      zonaFinal = z?._id || null;
    }

    const hash = await bcrypt.hash(password, 10);
    const usuario = await Usuario.create({
      nombre, email, password: hash, dni, telefono, direccion,
      latitud, longitud, rol: 'CIUDADANO', zona: zonaFinal,
    });

    // Avisar a administradores del nuevo registro
    const admins = await Usuario.find({ rol: { $in: ['ADMIN_MUNICIPAL', 'SUPER_ADMIN'] } }).select('_id');
    if (admins.length) {
      await Alerta.insertMany(admins.map((a) => ({
        tipo: 'SISTEMA',
        titulo: 'Nuevo ciudadano registrado',
        mensaje: `${nombre} se registró.${zonaFinal ? '' : ' Zona PENDIENTE de asignación.'}`,
        usuario: a._id,
      })));
    }

    await usuario.populate('zona');
    const token = firmarToken(usuario);
    return ok(res, { token, tipo: 'Bearer', usuario: perfil(usuario) }, 'Registro exitoso', 201);
  } catch (e) {
    console.error('register', e);
    return fail(res, 'Error en el registro', 500);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return fail(res, 'Email y contraseña requeridos');
    const usuario = await Usuario.findOne({ email: String(email).toLowerCase() })
      .select('+password')
      .populate('zona');
    if (!usuario || !usuario.activo) return fail(res, 'Credenciales inválidas', 401);
    const coincide = await bcrypt.compare(password, usuario.password);
    if (!coincide) return fail(res, 'Credenciales inválidas', 401);
    const token = firmarToken(usuario);
    return ok(res, { token, tipo: 'Bearer', usuario: perfil(usuario) }, 'Inicio de sesión exitoso');
  } catch (e) {
    console.error('login', e);
    return fail(res, 'Error en el inicio de sesión', 500);
  }
});

// GET /api/auth/me
router.get('/me', autenticar, async (req, res) => {
  const usuario = await Usuario.findById(req.usuario.id).populate('zona');
  if (!usuario) return fail(res, 'Usuario no encontrado', 404);
  return ok(res, perfil(usuario));
});

export default router;
export { zonaDesdePunto };

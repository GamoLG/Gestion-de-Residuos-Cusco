import jwt from 'jsonwebtoken';
import { fail } from '../utils.js';

const SECRET = process.env.JWT_SECRET || 'cambia-este-secreto';

export function firmarToken(usuario) {
  return jwt.sign(
    { id: usuario._id, email: usuario.email, rol: usuario.rol },
    SECRET,
    { expiresIn: '7d' }
  );
}

// Verifica el JWT del header Authorization: Bearer <token>
export function autenticar(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return fail(res, 'No autorizado: falta token', 401);
  try {
    req.usuario = jwt.verify(token, SECRET);
    next();
  } catch {
    return fail(res, 'No autorizado: token inválido o expirado', 401);
  }
}

// Restringe el acceso a ciertos roles
export function permitir(...roles) {
  return (req, res, next) => {
    if (!req.usuario || !roles.includes(req.usuario.rol)) {
      return fail(res, 'No tienes permiso para esta acción', 403);
    }
    next();
  };
}

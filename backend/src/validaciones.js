// Proyecto realizado por el estudiante Jhoel Alex Luicho Quispe, estudiante de la Escuela Profesional de Ingeniería Informática y de Sistemas - UNSAAC.
// Lógica pura extraída de las rutas (auth, horarios, dni) y de geocercas.js
// para poder probarla de forma aislada con Jest, sin Express ni MongoDB.
// Las reglas son las MISMAS que aplican los endpoints correspondientes.

// --- Auth (routes/auth.js) ---

// Reglas de POST /api/auth/register
export function validarRegistro({ nombre, email, password } = {}) {
  if (!nombre || !email || !password) {
    return { valido: false, error: 'Nombre, email y contraseña son obligatorios' };
  }
  if (String(password).length < 6) {
    return { valido: false, error: 'La contraseña debe tener al menos 6 caracteres' };
  }
  return { valido: true, error: null };
}

// Reglas de POST /api/auth/login
export function validarLogin({ email, password } = {}) {
  if (!email || !password) {
    return { valido: false, error: 'Email y contraseña requeridos' };
  }
  return { valido: true, error: null };
}

// Los endpoints buscan siempre por String(email).toLowerCase()
export function normalizarEmail(email) {
  return String(email).toLowerCase();
}

// --- DNI (routes/dni.js) ---

// Regla de GET /api/dni/:dni — exactamente 8 dígitos
export function validarDni(dni) {
  return /^\d{8}$/.test(dni);
}

// --- Horarios (routes/horarios.js) ---

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export function nombreDia(diaSemana) {
  return DIAS[diaSemana] ?? null;
}

// Reglas de POST /api/horarios — zona, diaSemana y hora requeridos
// (diaSemana == null rechaza null/undefined pero acepta el 0 = Domingo)
export function validarHorario({ zona, diaSemana, hora } = {}) {
  if (!zona || diaSemana == null || !hora) {
    return { valido: false, error: 'zona, diaSemana y hora son requeridos' };
  }
  return { valido: true, error: null };
}

// Filtro de GET /api/horarios?zona=<id> — activos y, si se pide, de esa zona
export function filtrarHorariosPorZona(horarios, zona) {
  return horarios.filter((h) => h.activo && (!zona || h.zona === zona));
}

// --- Geocercas (src/geocercas.js) ---

// Distancia en metros entre dos puntos (Haversine)
export function distanciaMetros(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const rad = (x) => (x * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

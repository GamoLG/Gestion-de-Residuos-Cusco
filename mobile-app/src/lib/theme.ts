// Paleta inspirada en el proyecto SistemaResiduos (oscuro estilo GitHub, acento azul)
export const colors = {
  bg: '#0d1117',
  bgElevated: '#161b22',
  bgSurface: '#21262d',
  border: '#30363d',
  borderStrong: '#3d444d',

  textPrimary: '#c9d1d9',
  textSecondary: '#8b949e',
  textMuted: '#6e7681',

  primary: '#58a6ff',
  primaryDark: '#1f6feb',
  primarySoft: 'rgba(56,139,253,0.15)',

  success: '#3fb950',
  warning: '#d29922',
  danger: '#f85149',

  white: '#ffffff',
};

export const radius = { sm: 8, md: 10, lg: 14, xl: 18, pill: 999 };
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 };

// Color por categoría de residuo / estado
export const categoriaColor: Record<string, string> = {
  ORGANICO: '#3fb950',
  RECICLABLE: '#58a6ff',
  NO_RECICLABLE: '#8b949e',
  PELIGROSO: '#f85149',
};

// Color de acento por rol (Entrega 3): ciudadano azul, operador verde, admin morado
export const rolAccent: Record<string, string> = {
  CIUDADANO: '#58a6ff',
  OPERADOR_CAMION: '#3fb950',
  ADMIN_ZONA: '#a371f7',
  ADMIN_MUNICIPAL: '#a371f7',
  SUPER_ADMIN: '#a371f7',
};

export const acentoDe = (rol?: string) => rolAccent[rol || ''] || colors.primary;

// Número de WhatsApp de soporte de la municipalidad (demo)
export const WHATSAPP_SOPORTE = '51984000000';

export const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export const estadoRutaColor: Record<string, string> = {
  PENDIENTE: '#8b949e',
  EN_PROGRESO: '#3fb950',
  COMPLETADA: '#58a6ff',
  CANCELADA: '#f85149',
};

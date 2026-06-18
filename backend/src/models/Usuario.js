import mongoose from 'mongoose';

export const ROLES = [
  'CIUDADANO',
  'OPERADOR_CAMION',
  'ADMIN_ZONA',
  'ADMIN_MUNICIPAL',
  'SUPER_ADMIN',
];

const usuarioSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    dni: { type: String, trim: true },
    telefono: { type: String, trim: true },
    direccion: { type: String, trim: true },
    latitud: Number,
    longitud: Number,
    rol: { type: String, enum: ROLES, default: 'CIUDADANO' },
    zona: { type: mongoose.Schema.Types.ObjectId, ref: 'Zona', default: null },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Usuario', usuarioSchema);

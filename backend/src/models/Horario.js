import mongoose from 'mongoose';
import { CATEGORIAS_RESIDUO } from './Residuo.js';

// 0=Domingo … 6=Sábado (igual que Date.getDay())
export const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// Horario de recojo por zona: qué día, a qué hora y qué tipo de residuo
const horarioSchema = new mongoose.Schema(
  {
    zona: { type: mongoose.Schema.Types.ObjectId, ref: 'Zona', required: true },
    diaSemana: { type: Number, min: 0, max: 6, required: true },
    hora: { type: String, required: true, trim: true }, // "06:30"
    tipoResiduo: { type: String, enum: CATEGORIAS_RESIDUO, default: 'NO_RECICLABLE' },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

horarioSchema.index({ zona: 1, diaSemana: 1 });

export default mongoose.model('Horario', horarioSchema);

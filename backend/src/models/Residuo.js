import mongoose from 'mongoose';

export const CATEGORIAS_RESIDUO = ['ORGANICO', 'RECICLABLE', 'NO_RECICLABLE', 'PELIGROSO'];

// Catálogo de tipos de residuo (guía de segregación) + registros de recolección
const residuoSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    categoria: { type: String, enum: CATEGORIAS_RESIDUO, default: 'NO_RECICLABLE' },
    descripcion: { type: String, trim: true },
    ejemplos: [String],
    color: { type: String, default: '#58a6ff' },
    // Para reportes de volumen recolectado por zona/periodo
    zona: { type: mongoose.Schema.Types.ObjectId, ref: 'Zona', default: null },
    pesoKg: { type: Number, default: 0 },
    mes: Number,
    anio: Number,
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Residuo', residuoSchema);

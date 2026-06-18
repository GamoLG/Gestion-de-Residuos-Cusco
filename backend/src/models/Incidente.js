import mongoose from 'mongoose';

export const TIPOS_INCIDENTE = [
  'BASURA_ACUMULADA',
  'CONTENEDOR_DANADO',
  'RECOLECCION_NO_REALIZADA',
  'DERRAME',
  'OTRO',
];
export const ESTADOS_INCIDENTE = ['PENDIENTE', 'EN_PROCESO', 'RESUELTO'];

const incidenteSchema = new mongoose.Schema(
  {
    tipo: { type: String, enum: TIPOS_INCIDENTE, default: 'OTRO' },
    descripcion: { type: String, required: true, trim: true },
    latitud: Number,
    longitud: Number,
    foto: { type: String, default: null },
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    zona: { type: mongoose.Schema.Types.ObjectId, ref: 'Zona', default: null },
    estado: { type: String, enum: ESTADOS_INCIDENTE, default: 'PENDIENTE' },
  },
  { timestamps: true }
);

export default mongoose.model('Incidente', incidenteSchema);

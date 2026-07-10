import mongoose from 'mongoose';

export const TIPOS_ALERTA = ['PROXIMIDAD', 'LLEGADA', 'PASO', 'RETRASO', 'INCIDENCIA', 'SISTEMA'];

const alertaSchema = new mongoose.Schema(
  {
    tipo: { type: String, enum: TIPOS_ALERTA, default: 'SISTEMA' },
    titulo: { type: String, trim: true },
    mensaje: { type: String, required: true, trim: true },
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    ruta: { type: mongoose.Schema.Types.ObjectId, ref: 'Ruta', default: null },
    leida: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Alerta', alertaSchema);

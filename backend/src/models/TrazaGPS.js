import mongoose from 'mongoose';

// Historial de posiciones del camión (para dibujar el recorrido real)
const trazaSchema = new mongoose.Schema(
  {
    ruta: { type: mongoose.Schema.Types.ObjectId, ref: 'Ruta', required: true },
    latitud: { type: Number, required: true },
    longitud: { type: Number, required: true },
  },
  { timestamps: true }
);

trazaSchema.index({ ruta: 1, createdAt: -1 });
// Se limpia sola a los 60 días
trazaSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 24 * 3600 });

export default mongoose.model('TrazaGPS', trazaSchema);

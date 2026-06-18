import mongoose from 'mongoose';

export const ESTADOS_RUTA = ['PENDIENTE', 'EN_PROGRESO', 'COMPLETADA', 'CANCELADA'];

const rutaSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    camionPlaca: { type: String, trim: true },
    operador: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', default: null },
    zona: { type: mongoose.Schema.Types.ObjectId, ref: 'Zona', default: null },
    estado: { type: String, enum: ESTADOS_RUTA, default: 'PENDIENTE' },
    // Ubicación actual del camión (para seguimiento en vivo)
    latitudActual: Number,
    longitudActual: Number,
    ultimaActualizacion: Date,
    // Paradas planificadas
    paradas: [
      {
        nombre: String,
        latitud: Number,
        longitud: Number,
        horaEstimada: String,
      },
    ],
    distanciaKm: { type: Number, default: 0 },
    fechaInicio: Date,
    fechaFin: Date,
  },
  { timestamps: true }
);

export default mongoose.model('Ruta', rutaSchema);

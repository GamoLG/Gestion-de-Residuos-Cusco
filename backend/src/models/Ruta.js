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
        atendida: { type: Boolean, default: false },
        horaAtencion: Date,
      },
    ],
    distanciaKm: { type: Number, default: 0 },
    // Recorrido planificado siguiendo las calles reales (calculado con OSRM,
    // no una línea recta entre paradas). Si está vacío, el mapa cae de vuelta
    // a unir las paradas en línea recta.
    recorridoPlanificado: [{ latitud: Number, longitud: Number }],
    fechaInicio: Date,
    fechaFin: Date,
  },
  { timestamps: true }
);

export default mongoose.model('Ruta', rutaSchema);

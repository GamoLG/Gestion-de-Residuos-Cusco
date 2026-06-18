import mongoose from 'mongoose';

const zonaSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, unique: true, trim: true },
    descripcion: { type: String, trim: true },
    distrito: { type: String, trim: true },
    color: { type: String, default: '#58a6ff' },
    // Polígono GeoJSON para detección punto-en-polígono
    geometry: {
      type: { type: String, enum: ['Polygon'], default: 'Polygon' },
      coordinates: { type: [[[Number]]], default: undefined },
    },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

zonaSchema.index({ geometry: '2dsphere' });

export default mongoose.model('Zona', zonaSchema);

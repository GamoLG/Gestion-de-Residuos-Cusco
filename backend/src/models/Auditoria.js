import mongoose from 'mongoose';

// Registro de quién creó/editó/eliminó qué (para el admin)
const auditoriaSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    actorNombre: { type: String, trim: true },
    accion: { type: String, enum: ['CREAR', 'EDITAR', 'ELIMINAR'], required: true },
    entidad: { type: String, required: true, trim: true }, // Usuario, Zona, Ruta…
    entidadId: { type: String, trim: true },
    detalle: { type: String, trim: true },
  },
  { timestamps: true }
);

auditoriaSchema.index({ createdAt: -1 });

export default mongoose.model('Auditoria', auditoriaSchema);

// Helper: registrar sin romper la operación principal si falla
export async function auditar(req, accion, entidad, entidadId, detalle = '') {
  try {
    await mongoose.model('Auditoria').create({
      actor: req.usuario?.id,
      actorNombre: req.usuario?.email || '',
      accion,
      entidad,
      entidadId: String(entidadId || ''),
      detalle,
    });
  } catch (e) {
    console.error('auditoria', e.message);
  }
}

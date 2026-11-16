import mongoose from "mongoose"

export const TIPOS_SERVICIO = [
  "Proyecto",
  "Mantención",
  "Climatización",
  "Proyecto eléctrico",
  "Emergencia",
  "Garantía",
  "Venta de repuestos",
  "Mejoras",
]

export const ESTADOS_PRESUPUESTO = ["Borrador", "Enviado", "Aprobado", "Rechazado"]

// Folios correlativos: PRE-2501, PRE-2502… Los folios PRE-2401 a PRE-2412 son de los datos de demostración.
export const FOLIO_BASE = 2500

// Contador atómico: $inc con upsert evita que dos solicitudes simultáneas obtengan el mismo folio.
const Contador =
  mongoose.models.Contador ||
  mongoose.model(
    "Contador",
    new mongoose.Schema({ _id: String, seq: { type: Number, default: 0 } }),
  )

const ItemSchema = new mongoose.Schema(
  {
    descripcion: { type: String, required: true, trim: true, maxlength: 160 },

    cantidad: { type: Number, required: true, min: 0 },

    precioUnitario: { type: Number, required: true, min: 0 },
  },
  { _id: true },
)

const PresupuestoSchema = new mongoose.Schema(
  {
    folio: { type: String, required: true, unique: true, trim: true },

    // Los clientes aún no tienen API: se guarda el id que usa el frontend (c1, c2…).
    clienteId: { type: String, required: true, trim: true, maxlength: 40 },

    tipo: { type: String, required: true, enum: TIPOS_SERVICIO },

    estado: {
      type: String,
      required: true,
      enum: ESTADOS_PRESUPUESTO,
      default: "Borrador",
    },

    items: { type: [ItemSchema], validate: (v) => v.length > 0 },

    // Importes en pesos enteros; el servidor los calcula siempre, nunca los recibe del cliente.
    neto: { type: Number, required: true, min: 0 },

    iva: { type: Number, required: true, min: 0 },

    total: { type: Number, required: true, min: 0 },

    creadoPor: { type: String, required: true },
  },
  { timestamps: true },
)

PresupuestoSchema.index({ createdAt: -1 })

PresupuestoSchema.statics.siguienteFolio = async function () {
  const contador = await Contador.findOneAndUpdate(
    { _id: "presupuesto" },
    { $inc: { seq: 1 } },
    { upsert: true, new: true },
  )

  return `PRE-${FOLIO_BASE + contador.seq}`
}

export default mongoose.models.Presupuesto ||
  mongoose.model("Presupuesto", PresupuestoSchema)

import mongoose from "mongoose"

const CompraSchema = new mongoose.Schema({
  id: { type: String },
  proveedor: { type: String, required: true, trim: true },

  cantidad: { type: Number, required: true, min: 0 },

  monto: { type: Number, required: true, min: 0 },

  descuento: { type: Number, required: true, min: 0, max: 100 },

  neto: { type: Number, required: true, min: 0 },

  iva: { type: Number, required: true, min: 0 },

  total: { type: Number, required: true, min: 0 },

  usuarioId: { type: String, required: true },

  fecha: { type: Date, default: Date.now },
})

const ArticuloSchema = new mongoose.Schema(
  {
    codigo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 160,
    },

    nombre: { type: String, required: true, trim: true, maxlength: 160 },

    categoria: { type: String, default: "General", trim: true, maxlength: 160 },

    stock: { type: Number, default: 0, min: 0 },

    stockCritico: { type: Number, default: 5, min: 0 },

    unidad: { type: String, default: "Unidad", trim: true, maxlength: 160 },

    compras: { type: [CompraSchema], default: [], select: false },
  },
  { timestamps: true },
)

export default mongoose.models.Articulo ||
  mongoose.model("Articulo", ArticuloSchema)

import { useEffect, useState, type FormEvent } from "react"

import * as Dialog from "@radix-ui/react-dialog"

import { Package, Plus, Search, X } from "lucide-react"

import { api, obtenerArticulos, mensajeError, type Articulo } from "@/lib/api"

import { useAppStore } from "@/store/useAppStore";

const inicial = {
  codigo: "",
  nombre: "",
  categoria: "General",
  stock: "0",
  stockCritico: "5",
  unidad: "Unidad",
}

export default function CatalogoPage() {
  const rol = useAppStore(state => state.usuario?.rol);
  const puedeCrear = rol === "Supervisor";
  const [articulos, setArticulos] = useState<Articulo[]>([])

  const [busqueda, setBusqueda] = useState("")

  const [cargando, setCargando] = useState(true)

  const [error, setError] = useState("")

  const [intento, setIntento] = useState(0)

  const [open, setOpen] = useState(false)

  const [form, setForm] = useState(inicial)

  const [guardando, setGuardando] = useState(false)

  const [errorModal, setErrorModal] = useState("")

  const [mensaje, setMensaje] = useState("")

  useEffect(() => {
    const c = new AbortController()
    setCargando(true)
    setError("")

    obtenerArticulos(c.signal)
      .then(setArticulos)
      .catch((err) => {
        if (!c.signal.aborted) setError(mensajeError(err))
      })
      .finally(() => {
        if (!c.signal.aborted) setCargando(false)
      })

    return () => c.abort()
  }, [intento])

  function cambiarModal(value: boolean) {
    if (guardando || !puedeCrear) return

    setOpen(value)
    setErrorModal("")

    if (value) {
      setForm(inicial)
      setMensaje("")
    }
  }

  async function guardar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (guardando || !puedeCrear) return

    const stock = Number(form.stock),
      stockCritico = Number(form.stockCritico)

    if (
      !form.codigo.trim() ||
      !form.nombre.trim() ||
      !form.categoria.trim() ||
      !form.unidad.trim() ||
      !Number.isFinite(stock) ||
      stock < 0 ||
      !Number.isFinite(stockCritico) ||
      stockCritico < 0
    ) {
      setErrorModal("Completa los campos y usa cantidades no negativas.")
      return
    }

    setGuardando(true)
    setErrorModal("")

    try {
      const { articulo } = await api<{ articulo: Articulo }>("/articulos", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          codigo: form.codigo.trim(),
          nombre: form.nombre.trim(),
          categoria: form.categoria.trim(),
          unidad: form.unidad.trim(),
          stock,
          stockCritico,
        }),
      })

      setArticulos((prev) =>
        [...prev, articulo].sort((a, b) => a.nombre.localeCompare(b.nombre)),
      )

      setOpen(false)
      setMensaje("Artículo creado correctamente.")
    } catch (err) {
      setErrorModal(mensajeError(err))
    } finally {
      setGuardando(false)
    }
  }

  const texto = busqueda.trim().toLocaleLowerCase("es")

  const filtrados = articulos.filter((a) =>
    `${a.nombre} ${a.codigo} ${a.categoria}`
      .toLocaleLowerCase("es")
      .includes(texto),
  )

  return (
    <div className="fyag-page">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-blue-900">
            Inventario
          </p>
          <h1 className="fyag-title mt-2">Catálogo de artículos</h1>
          <p className="fyag-subtitle">
            Consulta existencias y administra tus materiales.
          </p>
        </div>
        {puedeCrear && <button className="fyag-button" onClick={() => cambiarModal(true)}>
          <Plus className="size-4" /> Nuevo Artículo
        </button>}
      </header>
      {rol === "Gerencia" && <p role="note" className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">Modo lectura: puedes consultar el catálogo. La creación de artículos corresponde a Supervisor.</p>}
      {mensaje && (
        <p
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          {mensaje}
        </p>
      )}
      <section className="fyag-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Package className="size-5 text-blue-900" />
            Artículos{" "}
            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">
              {cargando || error ? "—" : articulos.length}
            </span>
          </div>
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-3 size-4 text-slate-400" />
            <label htmlFor="buscar" className="sr-only">
              Buscar artículos
            </label>
            <input
              id="buscar"
              className="fyag-input pl-10"
              placeholder="Buscar nombre, código o categoría…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>
        {cargando ? (
          <p role="status" className="p-12 text-center text-slate-500">
            Cargando catálogo…
          </p>
        ) : error ? (
          <div className="space-y-4 p-6">
            <p role="alert" className="fyag-error">
              {error}
            </p>
            <button
              className="fyag-secondary"
              onClick={() => setIntento((i) => i + 1)}
            >
              Reintentar
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-left text-sm">
              <caption className="sr-only">Existencias del catálogo</caption>
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  {[
                    "Código",
                    "Artículo",
                    "Categoría",
                    "Existencias",
                    "Estado",
                  ].map((h) => (
                    <th scope="col" key={h} className="px-6 py-4 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtrados.map((a) => (
                  <tr key={a._id} className="hover:bg-slate-50/70">
                    <td className="px-6 py-5 font-mono text-xs text-slate-500">
                      {a.codigo}
                    </td>
                    <td className="px-6 py-5 font-semibold text-slate-800">
                      {a.nombre}
                    </td>
                    <td className="px-6 py-5 text-slate-500">{a.categoria}</td>
                    <td className="px-6 py-5 font-semibold">
                      {a.stock.toLocaleString("es-CL")}{" "}
                      <span className="font-normal text-slate-400">
                        {a.unidad}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          a.stock <= a.stockCritico
                            ? "bg-amber-50 text-amber-800"
                            : "bg-emerald-50 text-emerald-800"
                        }`}
                      >
                        {a.stock <= a.stockCritico
                          ? "Stock crítico"
                          : "Disponible"}
                      </span>
                    </td>
                  </tr>
                ))}
                {!filtrados.length && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-500">
                      {articulos.length
                        ? "No hay coincidencias con tu búsqueda."
                        : puedeCrear ? "Todavía no hay artículos. Crea el primero." : "Todavía no hay artículos registrados."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {puedeCrear && <Dialog.Root open={open} onOpenChange={cambiarModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-sm" />
          <Dialog.Content
            onEscapeKeyDown={(e) => {
              if (guardando) e.preventDefault()
            }}
            onPointerDownOutside={(e) => {
              if (guardando) e.preventDefault()
            }}
            className="fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
          >
            <Dialog.Title className="pr-8 text-2xl font-bold text-slate-900">
              Nuevo artículo
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm leading-6 text-slate-500">
              Registra un material y define su nivel mínimo de existencias.
            </Dialog.Description>
            <Dialog.Close
              disabled={guardando}
              aria-label="Cerrar formulario"
              className="absolute right-5 top-5 rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            >
              <X className="size-5" />
            </Dialog.Close>
            <form onSubmit={guardar} className="mt-6 space-y-5">
              <fieldset
                disabled={guardando}
                className="grid gap-4 sm:grid-cols-2"
              >
                {([
                  ["codigo", "Código", "text"],
                  ["nombre", "Nombre del artículo", "text"],
                  ["categoria", "Categoría", "text"],
                  ["unidad", "Unidad de medida", "text"],
                  ["stock", "Stock inicial", "number"],
                  ["stockCritico", "Stock crítico", "number"],
                ] as const).map(([key, label, type]) => (
                  <div key={key}>
                    <label htmlFor={`art-${key}`} className="fyag-label">
                      {label}
                    </label>
                    <input
                      id={`art-${key}`}
                      required
                      type={type}
                      min={type === "number" ? 0 : undefined}
                      step={type === "number" ? "any" : undefined}
                      maxLength={type === "text" ? 160 : undefined}
                      className="fyag-input"
                      value={form[key]}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, [key]: e.target.value }))
                      }
                    />
                  </div>
                ))}
              </fieldset>
              {errorModal && (
                <p role="alert" className="fyag-error">
                  {errorModal}
                </p>
              )}
              <div className="flex justify-end gap-3 border-t pt-5">
                <button
                  type="button"
                  disabled={guardando}
                  className="fyag-secondary"
                  onClick={() => cambiarModal(false)}
                >
                  Cancelar
                </button>
                <button disabled={guardando} className="fyag-button">
                  {guardando ? "Guardando…" : "Guardar artículo"}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>}
    </div>
  )
}

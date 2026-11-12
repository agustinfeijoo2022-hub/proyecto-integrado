import { useEffect, useState } from "react"

import { Package, TriangleAlert, Layers3 } from "lucide-react"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

import { obtenerArticulos, mensajeError, type Articulo } from "@/lib/api"

export default function DashboardPage() {
  const [articulos, setArticulos] = useState<Articulo[]>([])

  const [cargando, setCargando] = useState(true)

  const [error, setError] = useState("")

  const [intento, setIntento] = useState(0)

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

  const criticos = articulos.filter((a) => a.stock <= a.stockCritico)

  const categorias = [...new Set(articulos.map((a) => a.categoria))]

  const datos = categorias
    .map((nombre) => ({
      nombre,
      articulos: articulos.filter((a) => a.categoria === nombre).length,
    }))
    .sort((a, b) => b.articulos - a.articulos)

  return (
    <div className="fyag-page">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-blue-900">
            Visión general
          </p>
          <h1 className="fyag-title mt-2">Panel de control</h1>
          <p className="fyag-subtitle">
            Disponibilidad de materiales y alertas del inventario actual.
          </p>
        </div>
        <button
          disabled={cargando}
          onClick={() => setIntento((i) => i + 1)}
          className="fyag-secondary"
        >
          Actualizar datos
        </button>
      </header>
      {error ? (
        <p role="alert" className="fyag-error">
          {error}
        </p>
      ) : cargando ? (
        <p role="status" className="fyag-card p-10 text-center text-slate-500">
          Consultando inventario…
        </p>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-3">
            {[
              {
                label: "Artículos registrados",
                value: articulos.length,
                Icon: Package,
                color: "bg-blue-50 text-blue-900",
              },
              {
                label: "Con stock crítico",
                value: criticos.length,
                Icon: TriangleAlert,
                color: "bg-amber-50 text-amber-700",
              },
              {
                label: "Categorías",
                value: categorias.length,
                Icon: Layers3,
                color: "bg-indigo-50 text-indigo-800",
              },
            ].map(({ label, value, Icon, color }) => (
              <section key={label} className="fyag-card p-6">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-500">{label}</p>
                  <span className={`rounded-xl p-3 ${color}`}>
                    <Icon className="size-5" />
                  </span>
                </div>
                <p className="mt-4 text-4xl font-bold tracking-tight">
                  {value.toLocaleString("es-CL")}
                </p>
              </section>
            ))}
          </div>
          <div className="grid items-start gap-6 xl:grid-cols-[1.2fr_1fr]">
            <section className="fyag-card min-w-0 p-6">
              <h2 className="text-lg font-bold">Artículos por categoría</h2>
              <p className="fyag-subtitle">
                Cantidad de referencias, sin sumar unidades de medida distintas.
              </p>
              {datos.length ? (
                <>
                  <div className="mt-6 h-72" aria-hidden="true">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={datos}>
                        <CartesianGrid
                          stroke="#e2e8f0"
                          strokeDasharray="3 3"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="nombre"
                          tick={{ fontSize: 11 }}
                          interval={0}
                        />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                        <Tooltip cursor={{ fill: "#f1f5f9" }} />
                        <Bar
                          name="Artículos"
                          dataKey="articulos"
                          fill="#1e3a8a"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={48}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <ul className="sr-only">
                    {datos.map((d) => (
                      <li key={d.nombre}>
                        {d.nombre}: {d.articulos} artículos
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="py-16 text-center text-sm text-slate-500">
                  Aún no hay datos para mostrar.
                </p>
              )}
            </section>
            <section className="fyag-card p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold">Requieren atención</h2>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
                  {criticos.length}
                </span>
              </div>
              <p className="fyag-subtitle">
                Artículos en su nivel mínimo o por debajo.
              </p>
              <ul className="mt-5 max-h-96 space-y-3 overflow-y-auto">
                {criticos.map((a) => (
                  <li
                    key={a._id}
                    className="rounded-xl border border-amber-100 bg-amber-50/60 p-4"
                  >
                    <div className="flex justify-between gap-3">
                      <p className="text-sm font-semibold">{a.nombre}</p>
                      <span className="whitespace-nowrap text-sm font-bold text-amber-800">
                        {a.stock} {a.unidad}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {a.codigo} · Mínimo: {a.stockCritico} {a.unidad}
                    </p>
                  </li>
                ))}
              </ul>
              {!criticos.length && (
                <p className="mt-5 rounded-xl bg-emerald-50 p-5 text-sm text-emerald-800">
                  {articulos.length
                    ? "El inventario no presenta alertas de stock."
                    : "Registra artículos para comenzar el seguimiento."}
                </p>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  )
}

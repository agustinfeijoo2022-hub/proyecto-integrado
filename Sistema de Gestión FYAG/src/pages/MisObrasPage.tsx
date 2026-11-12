import { useAppStore } from "@/store/useAppStore"

export default function MisObrasPage() {
  const usuario = useAppStore((s) => s.usuario)

  const todas = useAppStore((s) => s.obras)

  const obras = usuario?.tecnicoId
    ? todas.filter((o) => o.tecnicoId === usuario.tecnicoId)
    : []

  return (
    <div className="fyag-page">
      <header>
        <h1 className="fyag-title">Mis Tareas</h1>
        <p className="fyag-subtitle">
          Hola, {usuario?.nombre}. Estas son tus asignaciones.
        </p>
      </header>
      <p className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
        Las obras provienen de los datos de demostración del proyecto; todavía
        no están conectadas a una API de obras.
      </p>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {obras.map((o) => (
          <article key={o.id} className="fyag-card p-6">
            <p className="text-xs font-bold tracking-wide text-blue-900">
              {o.codigo}
            </p>
            <h2 className="mt-2 text-lg font-bold">{o.nombre}</h2>
            <p className="mt-3 text-sm text-slate-500">{o.estado}</p>
            <label
              htmlFor={`avance-${o.id}`}
              className="mt-6 block text-xs font-medium text-slate-500"
            >
              Avance: {o.avance}%
            </label>
            <progress
              id={`avance-${o.id}`}
              max={100}
              value={o.avance}
              className="mt-2 h-2 w-full accent-blue-900"
            />
          </article>
        ))}
      </div>
      {!obras.length && (
        <div className="fyag-card p-10 text-center text-slate-500">
          No tienes obras asignadas.
        </div>
      )}
    </div>
  )
}

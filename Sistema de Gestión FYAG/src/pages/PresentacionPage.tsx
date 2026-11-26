
import { ArrowLeft, ArrowRight, Boxes, BriefcaseBusiness, ChartNoAxesCombined, ClipboardList, PackageCheck, Wrench } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import SectionPhoto, { ManagementBackdrop } from "@/components/SectionPhoto";
import ThemeToggle from "@/components/ThemeToggle";

const perfiles = [
  {
    id: "gerencia", nombre: "Gerencia", descripcion: "Indicadores, reportes y auditoría", icono: ChartNoAxesCombined,
    modulos: [
      { titulo: "Indicadores", filas: [["Obras en curso", "4"], ["Presupuestos por revisar", "2"], ["Cobranza pendiente", "$1.485.000"]] },
      { titulo: "Reportes", filas: [["Operación mensual", "Noviembre 2026"], ["Inventario de bodega", "32 artículos"]] },
      { titulo: "Auditoría", filas: [["Presupuesto PRE-104 aprobado", "Gerencia"], ["Obra OB-026 asignada", "Bodega"]] },
    ],
  },
  {
    id: "finanzas", nombre: "Finanzas", descripcion: "Clientes, presupuestos, facturación y cobranza", icono: BriefcaseBusiness,
    modulos: [
      { titulo: "Clientes", filas: [["Agroindustria Río Sur", "Cliente de muestra"], ["Frutícola Valle Norte", "Cliente de muestra"]] },
      { titulo: "Presupuestos", filas: [["PRE-104 · Mantención de cámara", "Aprobado"], ["PRE-105 · Cambio de evaporador", "En revisión"]] },
      { titulo: "Facturación", filas: [["FAC-108 · Mantención de cámara", "$940.000"], ["FAC-109 · Repuestos", "$545.000"]] },
      { titulo: "Cobranza", filas: [["FAC-108", "Pendiente"], ["FAC-109", "Pendiente"]] },
    ],
  },
  {
    id: "bodega", nombre: "Encargado de Bodega", descripcion: "Catálogo, compras y recepción de mercancía", icono: PackageCheck,
    modulos: [
      { titulo: "Catálogo", filas: [["REF-001 · Filtro secador", "18 unidades"], ["AIS-001 · Aislante elastomérico", "24 metros"]] },
      { titulo: "Compras", filas: [["OC-038 · Filtros y conexiones", "Pendiente de recepción"], ["OC-037 · Insumos eléctricos", "Recibida"]] },
      { titulo: "Recepción", filas: [["OC-038 · Filtro secador", "12 unidades por recibir"]] },
    ],
  },
  {
    id: "tecnico", nombre: "Técnico", descripcion: "Obras asignadas y uso de materiales", icono: Wrench,
    modulos: [
      { titulo: "Mis tareas", filas: [["OB-026 · Mantención de cámara", "Alta · En curso"], ["OB-027 · Inspección de sensores", "Normal · Pendiente"]] },
      { titulo: "Materiales", filas: [["OB-026 · Filtro secador", "2 unidades asignadas"], ["OB-026 · Aislante", "6 metros asignados"]] },
    ],
  },
];

const enlace = "inline-flex min-h-11 items-center gap-2 rounded-lg font-medium text-foreground underline underline-offset-4 hover:text-primary";

export default function PresentacionPage() {
  const [params] = useSearchParams();
  const perfil = perfiles.find(item => item.id === params.get("perfil"));
  const modulo = perfil?.modulos.find(item => item.titulo === params.get("modulo")) ?? perfil?.modulos[0];

  return (
    <main className="fyag-workspace relative isolate grid min-h-svh place-items-center bg-app px-4 py-16 text-foreground sm:px-8">
      <ManagementBackdrop />
      <div className="absolute right-4 top-4 sm:right-8" aria-label="Tema de la interfaz"><ThemeToggle /></div>

      {perfil && modulo ? (
        <section className="w-full max-w-5xl rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-9">
          <div className="flex flex-wrap justify-between gap-x-5">
            <Link to="/login" className={enlace}><ArrowLeft className="size-4" aria-hidden="true" /> Elegir otro perfil</Link>
            <Link to="/acceso" className={enlace}>Acceso con cuenta de trabajo</Link>
          </div>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">{perfil.nombre}</h1>
          <p className="mt-2 text-muted-foreground">Presentación con datos de muestra.</p>
          <nav aria-label="Módulos del perfil" className="mt-6 flex flex-wrap gap-2">
            {perfil.modulos.map(item => (
              <Link key={item.titulo} to={`?perfil=${perfil.id}&modulo=${encodeURIComponent(item.titulo)}`}
                aria-current={item === modulo ? "page" : undefined}
                className={`rounded-xl border px-4 py-2.5 font-medium ${item === modulo ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-accent"}`}>
                {item.titulo}
              </Link>
            ))}
          </nav>
          <section className="mt-6 rounded-2xl border border-border px-4 py-5 sm:px-6">
            <h2 className="flex items-center gap-2 text-xl font-semibold"><ClipboardList className="size-5" aria-hidden="true" /> {modulo.titulo}</h2>
            <dl className="mt-3 divide-y divide-border">
              {modulo.filas.map(([nombre, valor]) => (
                <div key={nombre} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3">
                  <dt>{nombre}</dt><dd className="font-semibold">{valor}</dd>
                </div>
              ))}
            </dl>
          </section>
        </section>
      ) : (
        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-border bg-card shadow-sm md:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)]">
          <section className="relative isolate flex flex-col justify-between overflow-hidden bg-[#153d30] px-6 py-7 text-white sm:px-10 md:min-h-[540px] md:py-11">
            <SectionPhoto />
            <Link to="/" className="flex w-fit items-center gap-3 text-xl font-semibold">
              <span className="grid size-10 place-items-center rounded-xl bg-white/10 text-emerald-100"><Boxes className="size-5" aria-hidden="true" /></span>FYAG
            </Link>
            <p className="mt-6 max-w-xs text-2xl font-semibold tracking-tight sm:text-4xl">Logística e inventario</p>
          </section>
          <section className="px-6 py-8 sm:px-12 sm:py-11">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Elige un perfil</h1>
            <p className="mt-2 text-sm text-muted-foreground">Presentación con datos de muestra.</p>
            <ul className="mt-6 space-y-3">
              {perfiles.map(({ id, nombre, descripcion, icono: Icono }) => (
                <li key={id}>
                  <Link to={`?perfil=${id}`} className="flex min-h-16 items-center gap-3 rounded-xl border border-border px-4 py-3 hover:border-primary hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                    <Icono className="size-5 shrink-0 text-primary" aria-hidden="true" />
                    <span className="min-w-0 flex-1"><span className="block font-semibold">{nombre}</span><span className="block text-sm text-muted-foreground">{descripcion}</span></span>
                    <ArrowRight className="size-4 shrink-0 text-primary" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
            <Link to="/acceso" className={`${enlace} mt-3`}>Acceso con cuenta de trabajo</Link>
          </section>
        </div>
      )}
    </main>
  );
}


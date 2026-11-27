
import { ArrowRight, Boxes, BriefcaseBusiness, ChartNoAxesCombined, PackageCheck, Wrench } from "lucide-react";
import { Link } from "react-router-dom";
import SectionPhoto, { ManagementBackdrop } from "@/components/SectionPhoto";
import ThemeToggle from "@/components/ThemeToggle";

const perfiles = [
  {
    id: "gerencia", nombre: "Gerencia", descripcion: "Indicadores, reportes y auditoría", icono: ChartNoAxesCombined,
  },
  {
    id: "finanzas", nombre: "Finanzas", descripcion: "Clientes, presupuestos, facturación y cobranza", icono: BriefcaseBusiness,
  },
  {
    id: "bodega", nombre: "Encargado de Bodega", descripcion: "Catálogo, compras y recepción de mercancía", icono: PackageCheck,
  },
  {
    id: "tecnico", nombre: "Técnico", descripcion: "Obras asignadas y uso de materiales", icono: Wrench,
  },
];

export default function PresentacionPage() {
  return (
    <main className="fyag-workspace relative isolate grid min-h-svh place-items-center bg-app px-4 py-16 text-foreground sm:px-8">
      <ManagementBackdrop />
      <div className="absolute right-4 top-4 sm:right-8" aria-label="Tema de la interfaz"><ThemeToggle /></div>

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
                <Link reloadDocument to={`/app/${id === "tecnico" ? "mis-obras" : "dashboard"}?presentacion=${id}`} className="flex min-h-16 items-center gap-3 rounded-xl border border-border px-4 py-3 hover:border-primary hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                  <Icono className="size-5 shrink-0 text-primary" aria-hidden="true" />
                  <span className="min-w-0 flex-1"><span className="block font-semibold">{nombre}</span><span className="block text-sm text-muted-foreground">{descripcion}</span></span>
                  <ArrowRight className="size-4 shrink-0 text-primary" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

    </main>
  );
}


import { ArrowRight, Boxes, PackageCheck, Snowflake, Wrench } from "lucide-react";
import { Link } from "react-router-dom";

const servicios = [
  { titulo: "Refrigeración industrial", icono: Snowflake },
  { titulo: "Mantención y obras", icono: Wrench },
  { titulo: "Logística e inventario", icono: PackageCheck },
];

export default function PortadaEmpresa() {
  return (
    <main className="relative isolate flex min-h-svh flex-col overflow-hidden bg-[#0a2018] text-white">
      <img
        alt=""
        referrerPolicy="no-referrer"
        className="absolute inset-0 -z-20 size-full object-cover [object-position:center_48%]"
        src="https://images.pexels.com/photos/28726413/pexels-photo-28726413.jpeg?auto=compress&cs=tinysrgb&w=1600"
      />
      <div aria-hidden="true" className="fyag-portada-sombra absolute inset-0 -z-10" />
      <header className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-6 sm:px-10">
        <div className="flex items-center gap-3 font-semibold tracking-wide">
          <span className="grid size-10 place-items-center rounded-xl border border-white/30 bg-white/10">
            <Boxes className="size-5" aria-hidden="true" />
          </span>
          FYAG
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-7xl flex-1 items-center px-5 py-14 sm:px-10 sm:py-20">
        <section className="max-w-3xl">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">Frío y Agroindustria</h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-emerald-50 sm:text-xl">
            Refrigeración industrial, mantención e inventario. Una plataforma para coordinar materiales, obras y cobros.
          </p>
          <Link to="/login"
            className="mt-8 inline-flex min-h-12 items-center gap-3 rounded-xl bg-emerald-200 px-5 py-3 font-bold text-emerald-950 hover:bg-emerald-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
            Iniciar sesión <ArrowRight className="size-5" aria-hidden="true" />
          </Link>
        </section>
      </div>
      <ul className="mx-auto grid w-full max-w-7xl gap-3 px-5 pb-7 sm:grid-cols-3 sm:px-10">
        {servicios.map(({ titulo, icono: Icono }) => (
          <li key={titulo} className="flex items-center gap-3 rounded-xl border border-white/20 bg-[#0a2018]/75 px-4 py-3 text-sm font-semibold sm:text-base">
            <Icono className="size-5 shrink-0 text-emerald-200" aria-hidden="true" /> {titulo}
          </li>
        ))}
      </ul>
    </main>
  );
}

import type { ReactNode } from "react";
import SectionPhoto from "@/components/SectionPhoto";
import { Muted, PageTitle } from "@/components/ui/typography";

const areas = {
  gestion: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900",
  finanzas: "bg-violet-50 border-violet-200 dark:bg-violet-950/40 dark:border-violet-900",
  bodega: "bg-teal-50 border-teal-200 dark:bg-teal-950/40 dark:border-teal-900",
  seguimiento: "bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900",
};

export default function PageHeader({ title, description, actions, area = "gestion" }: {
  title: string;
  description?: string;
  actions?: ReactNode;
  area?: keyof typeof areas;
}) {
  return <header className={`mb-6 grid overflow-hidden rounded-2xl border shadow-sm lg:min-h-52 lg:grid-cols-[minmax(0,1fr)_42%] ${areas[area]}`}>
    <div className="flex min-w-0 flex-col justify-center gap-4 px-5 py-5 sm:px-8 sm:py-7 lg:gap-6 lg:px-10">
      <div className="min-w-0">
        <PageTitle className="break-words text-3xl font-semibold sm:text-4xl">{title}</PageTitle>
        {description && <Muted className="mt-2 max-w-2xl leading-relaxed">{description}</Muted>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
    <SectionPhoto gerencia={area === "gestion"} />
  </header>;
}

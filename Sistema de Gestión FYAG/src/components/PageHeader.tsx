import type { ReactNode } from "react";
import { Muted, PageTitle } from "@/components/ui/typography";

const areas = {
  gestion: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900",
  finanzas: "bg-violet-50 border-violet-200 dark:bg-violet-950/40 dark:border-violet-900",
  bodega: "bg-teal-50 border-teal-200 dark:bg-teal-950/40 dark:border-teal-900",
  seguimiento: "bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900",
};

export default function PageHeader({ title, description, actions, area = "gestion" }: {
  title: string;
  description: string;
  actions?: ReactNode;
  area?: keyof typeof areas;
}) {
  return <header className={`mb-6 flex flex-col justify-between gap-5 rounded-2xl border px-5 py-6 sm:flex-row sm:items-end sm:px-8 sm:py-8 ${areas[area]}`}>
    <div className="min-w-0">
      <PageTitle className="break-words text-3xl font-semibold sm:text-4xl">{title}</PageTitle>
      <Muted className="mt-2 max-w-2xl leading-relaxed">{description}</Muted>
    </div>
    {actions && <div className="flex flex-wrap gap-2 sm:justify-end">{actions}</div>}
  </header>;
}

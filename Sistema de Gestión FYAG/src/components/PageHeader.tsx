import type { ReactNode } from "react";
import { Muted, PageTitle } from "@/components/ui/typography";

export default function PageHeader({ title, description, actions }: { title: string; description: string; actions?: ReactNode }) {
  return <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
    <div><PageTitle>{title}</PageTitle><Muted className="mt-1">{description}</Muted></div>
    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
  </div>;
}

import { Inbox } from "lucide-react";
import { Muted, SectionTitle } from "@/components/ui/typography";

export default function EmptyState({ title = "No hay resultados" }: { title?: string }) {
  return <div className="grid place-items-center gap-2 p-10 text-center"><Inbox className="size-8 text-muted-foreground" /><SectionTitle>{title}</SectionTitle><Muted>Prueba ajustando los filtros de búsqueda.</Muted></div>;
}

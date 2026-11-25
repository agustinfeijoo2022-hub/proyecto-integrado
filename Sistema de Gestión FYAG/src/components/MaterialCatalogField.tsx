import { useId } from "react";
import { Input } from "@/components/ui/input";

export interface ArticuloMaterial {
  codigo: string;
  nombre: string;
  stock: number;
  unidad?: string;
}

export default function MaterialCatalogField({ etiqueta, catalogo, codigo, onChange }: {
  etiqueta: string;
  catalogo: ArticuloMaterial[];
  codigo: string;
  onChange: (codigo: string) => void;
}) {
  const id = useId();
  const articulo = catalogo.find(item => item.codigo.toLowerCase() === codigo.trim().toLowerCase());
  return <div className="min-w-0">
    <label htmlFor={id} className="sr-only">{etiqueta}</label>
    <Input id={id} list={`${id}-catalogo`} value={codigo} placeholder="Buscar por código o producto"
      onChange={event => onChange(event.target.value)} />
    <datalist id={`${id}-catalogo`}>
      {catalogo.map(item => <option key={item.codigo} value={item.codigo} label={item.nombre} />)}
    </datalist>
    {articulo && <p className="mt-1 text-xs text-muted-foreground">
      {articulo.nombre} · {articulo.unidad ?? "Unidad"} · Stock {articulo.stock.toLocaleString("es-CL")}
    </p>}
  </div>;
}

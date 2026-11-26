import { PuntoGuia } from "@/components/GuiaDeUso";
import PageHeader from "@/components/PageHeader";
import { useState, useEffect } from "react";
import { Download, PackageOpen, Package, Plus, Search, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/useAppStore";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/input";
import { toast } from "sonner";
import { generarPDF } from "@/lib/pdfGenerator";
import { generarExcel } from "@/lib/excelGenerator";
import { api, mensajeError, obtenerArticulos, type Articulo } from "@/lib/api";

export default function CatalogoPage() {
  const [catalogos, setCatalogos] = useState<Articulo[]>([]);
  const rol = useAppStore(state => state.usuario?.rol);
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("");
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [intento, setIntento] = useState(0);
  const [guardando, setGuardando] = useState(false);

  const crear = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setGuardando(true);
    try {
      const campos = Object.fromEntries(new FormData(event.currentTarget));
      const { articulo } = await api<{ articulo: Articulo }>("/articulos", { method: "POST", body: JSON.stringify(campos) });
      setCatalogos(items => [...items, articulo].sort((a, b) => a.nombre.localeCompare(b.nombre, "es")));
      setAbierto(false);
      toast.success("Artículo creado.");
    } catch (error) { toast.error(mensajeError(error)); }
    finally { setGuardando(false); }
  };

  useEffect(() => {
    const controller = new AbortController();
    setCargando(true);
    setErrorCarga("");
    obtenerArticulos(controller.signal)
      .then(setCatalogos)
      .catch(error => { if (!controller.signal.aborted) setErrorCarga(mensajeError(error)); })
      .finally(() => { if (!controller.signal.aborted) setCargando(false); });
    return () => controller.abort();
  }, [intento]);

  const categorias = [...new Set(catalogos.map(item => item.categoria || "General"))].sort((a, b) => a.localeCompare(b, "es"));
  const normalizar = (texto: string) => texto.toLocaleLowerCase("es").normalize("NFD").replace(/\p{Diacritic}/gu, "");
  const consulta = normalizar(busqueda.trim());
  const visibles = catalogos.filter(item =>
    (!categoria || (item.categoria || "General") === categoria) &&
    normalizar(`${item.codigo} ${item.nombre}`).includes(consulta),
  );

  const datos = () => ({
    columnas: ["Código", "Nombre", "Categoría", "Stock", "Unidad"],
    filas: catalogos.map((c) => [
      c.codigo, c.nombre, c.categoria || "—", c.stock ?? 0, c.unidad || "Unidad",
    ]),
  });

  const exportar = async (formato: "pdf" | "excel") => {
    const { columnas, filas } = datos();
    try {
      if (formato === "pdf") generarPDF("Catálogo de productos", columnas, filas, "catalogos");
      else await generarExcel("Catálogo de productos", columnas, filas, "catalogos");
    } catch {
      toast.error("No se pudo exportar el catálogo.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader area="bodega" title="Catálogo de productos" actions={
        <>
            {(rol === "Finanzas" || rol === "Encargado de Bodega") && (
              <>
                <Button variant="outline"
                  onClick={() => void exportar("excel")}
                >
                  <FileSpreadsheet className="size-4 mr-1" /> Excel
                </Button>
                <Button variant="outline"
                  onClick={() => void exportar("pdf")}>
                  <Download className="size-4 mr-1" /> PDF
                </Button>
              </>
            )}
            {rol === "Encargado de Bodega" && (
              <Dialog open={abierto} onOpenChange={setAbierto}>
                <DialogTrigger asChild><Button><Plus className="size-4 mr-1" /> Nuevo ítem</Button></DialogTrigger>
                <DialogContent>
                  <DialogTitle>Nuevo artículo</DialogTitle>
                  <DialogDescription>Identifica el artículo con el código que usará la bodega.</DialogDescription>
                  <form className="grid gap-3" onSubmit={crear}>
                    <Field label="Código"><Input name="codigo" required maxLength={160} /></Field>
                    <Field label="Nombre"><Input name="nombre" required maxLength={160} /></Field>
                    <Field label="Categoría"><Input name="categoria" defaultValue="General" required maxLength={160} /></Field>
                    <Field label="Unidad"><Input name="unidad" defaultValue="Unidad" required maxLength={160} /></Field>
                    <Button disabled={guardando} type="submit">Guardar artículo</Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
        </>
      } />

      <PuntoGuia id="buscar-productos" />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="min-w-0 flex-1 text-sm font-medium">
          Buscar producto
          <span className="relative mt-1 block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input className="pl-9" placeholder="Nombre o código" value={busqueda} onChange={event => setBusqueda(event.target.value)} />
          </span>
        </label>
        <label className="text-sm font-medium sm:w-64">
          Categoría
          <select className="fyag-input mt-1" value={categoria} onChange={event => setCategoria(event.target.value)}>
            <option value="">Todas las categorías</option>
            {categorias.map(item => <option key={item}>{item}</option>)}
          </select>
        </label>
      </div>
      <PuntoGuia id="resultados-productos" />
      {cargando ? <p role="status" className="text-sm text-muted-foreground">Cargando catálogo…</p> : errorCarga ? (
        <p role="alert" className="fyag-error">{errorCarga} <button className="underline" onClick={() => setIntento(i => i + 1)}>Reintentar</button></p>
      ) : !visibles.length ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border px-4 py-12 text-center text-muted-foreground">
          <PackageOpen className="size-8" aria-hidden="true" />
          <p>{catalogos.length ? "No hay productos que coincidan con los filtros." : "Todavía no hay productos registrados."}</p>
        </div>
      ) : (
        <>
          <p role="status" className="text-sm text-muted-foreground">{visibles.length} {visibles.length === 1 ? "producto" : "productos"}</p>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibles.map(item => {
              const stock = item.stock ?? 0;
              const estado = stock <= 0 ? "Sin stock" : stock <= item.stockCritico ? "Stock bajo" : "Disponible";
              const tono = estado === "Disponible" ? "text-teal-800 dark:text-teal-300" : estado === "Stock bajo" ? "text-amber-800 dark:text-amber-300" : "text-rose-800 dark:text-rose-300";
              return <li key={item._id || item.codigo} className="flex min-w-0 flex-col rounded-2xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-teal-100 text-teal-900 dark:bg-teal-900/50 dark:text-teal-200"><Package className="size-5" aria-hidden="true" /></span>
                  <span className="break-all rounded-md bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">{item.codigo}</span>
                </div>
                <div className="mt-4 grow">
                  <p className="text-xs font-semibold text-muted-foreground">{item.categoria || "General"}</p>
                  <h2 className="mt-1 break-words text-lg font-semibold leading-snug">{item.nombre}</h2>
                </div>
                <div className="mt-5 flex flex-wrap items-end justify-between gap-2 border-t border-border pt-4">
                  <p><span className="text-2xl font-semibold tabular-nums">{stock.toLocaleString("es-CL")}</span> <span className="text-xs text-muted-foreground">{item.unidad || "Unidad"}</span></p>
                  <p className={`text-xs font-semibold ${tono}`}>{estado}</p>
                </div>
              </li>;
            })}
          </ul>
        </>
      )}
    </div>
  );
}

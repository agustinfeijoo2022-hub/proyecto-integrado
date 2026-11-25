import { useState, useEffect } from "react";
import { PackageCheck, Truck, Package } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SectionTitle } from "@/components/ui/typography";
import { api, mensajeError, type Compra } from "@/lib/api";

export default function RecepcionMercanciaPage() {
  const [comprasPendientes, setComprasPendientes] = useState<Compra[]>([]);
  const [compraSeleccionada, setCompraSeleccionada] = useState<Compra | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [cantidadRecibida, setCantidadRecibida] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [cargando, setCargando] = useState(true);

  const filtro = busqueda.trim().toLocaleLowerCase("es");
  const visibles = comprasPendientes.filter(compra =>
    compra.id === compraSeleccionada?.id ||
    `${compra.codigoArticulo} ${compra.nombreArticulo} ${compra.proveedor}`.toLocaleLowerCase("es").includes(filtro),
  );

  const cargarCompras = () => {
    setCargando(true);
    api<Compra[]>("/compras?pendientes=true")
      .then((data) => {
        setComprasPendientes(data.filter(c => !c.recibida));
      })
      .catch((err) => toast.error(mensajeError(err)))
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    cargarCompras();
  }, []);

  const seleccionarCompra = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    const compra = comprasPendientes.find(c => c.id === id) || null;
    setCompraSeleccionada(compra);
    setCantidadRecibida(compra ? String(compra.cantidad) : "");
  };

  const confirmarRecepcion = async () => {
    const cantidad = Number(cantidadRecibida);
    if (!compraSeleccionada || guardando) return;
    if (!(cantidad > 0 && cantidad <= compraSeleccionada.cantidad)) {
      toast.error("Ingresa una cantidad mayor que cero y que no supere lo comprado.");
      return;
    }
    setGuardando(true);

    try {
      await api(`/compras/${compraSeleccionada.articuloId}/recibir/${compraSeleccionada.id}`, { method: "POST", body: JSON.stringify({ cantidad }) });
      toast.success("¡Mercancía recibida y stock actualizado!");
      setCompraSeleccionada(null);
      setCantidadRecibida("");
      cargarCompras();
    } catch (error) {
      toast.error(mensajeError(error));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fyag-page space-y-6">
      <PageHeader area="bodega"
        title="Recepción de Mercancía"
        description="Registra el ingreso físico de los productos comprados por Finanzas."
      />

      <Card>
        <CardHeader>
          <SectionTitle>1. Selecciona la Orden de Compra</SectionTitle>
          <p className="text-sm text-muted-foreground">Elige el código del producto que acaba de llegar a la bodega.</p>
        </CardHeader>
        <CardContent>
          <div className="max-w-md">
            <label htmlFor="buscar-compra" className="block text-sm font-medium mb-2">Buscar por código, artículo o proveedor</label>
            <input id="buscar-compra" className="fyag-input mb-3" value={busqueda} onChange={event => setBusqueda(event.target.value)} />
            <label htmlFor="compra-select" className="block text-sm font-medium mb-2">Órdenes pendientes de recepción</label>
            <select
              id="compra-select"
              className="fyag-input"
              value={compraSeleccionada?.id || ""}
              onChange={seleccionarCompra}
              disabled={cargando}
            >
              <option value="">Selecciona un producto para autocompletar...</option>
              {visibles.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.codigoArticulo} · {c.nombreArticulo} (Prov: {c.proveedor})
                </option>
              ))}
            </select>
            {comprasPendientes.length > 0 && visibles.length === 0 && <p className="mt-2 text-sm">No hay órdenes que coincidan.</p>}
            {comprasPendientes.length === 0 && !cargando && (
              <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">No hay compras pendientes de recepción. ¡Todo al día!</p>
            )}
          </div>
        </CardContent>
      </Card>

      {compraSeleccionada && (
        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-900/10">
          <CardHeader>
            <SectionTitle>2. Confirma los datos</SectionTitle>
            <p className="text-sm text-muted-foreground">Los campos se han autocompletado con la orden de compra.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Proveedor</label>
                <div className="mt-1 flex items-center gap-2 rounded-lg border border-border bg-card p-3 text-sm">
                  <Truck className="size-4 text-muted-foreground" /> {compraSeleccionada.proveedor}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Artículo</label>
                <div className="mt-1 flex items-center gap-2 rounded-lg border border-border bg-card p-3 text-sm">
                  <Package className="size-4 text-muted-foreground" /> {compraSeleccionada.nombreArticulo} ({compraSeleccionada.codigoArticulo})
                </div>
              </div>
            </div>

            <div className="max-w-xs">
              <label htmlFor="cantidad-recibida" className="text-xs font-semibold text-muted-foreground uppercase">Cantidad que llegó</label>
              <div className="mt-1 flex gap-2">
                <input
                  id="cantidad-recibida"
                  type="number"
                  min="0"
                  max={compraSeleccionada.cantidad}
                  step="any"
                  className="fyag-input"
                  value={cantidadRecibida}
                  onChange={(e) => setCantidadRecibida(e.target.value)}
                />
                <span className="flex items-center px-3 text-sm font-medium rounded-xl bg-muted text-muted-foreground">
                  {compraSeleccionada.unidad}
                </span>
              </div>
              {Number(cantidadRecibida) > 0 && Number(cantidadRecibida) < compraSeleccionada.cantidad &&
                <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">La confirmación cerrará esta orden y registrará solo la cantidad que llegó.</p>}
              <p className="mt-1 text-xs text-muted-foreground">Ordenado originalmente: {compraSeleccionada.cantidad} {compraSeleccionada.unidad}</p>
            </div>

            <div className="pt-4 border-t border-border">
              <Button disabled={guardando} onClick={confirmarRecepcion} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white">
                <PackageCheck className="size-5 mr-2" /> Confirmar Recepción e Ingresar al Stock
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
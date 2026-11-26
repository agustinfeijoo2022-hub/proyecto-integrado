import { PuntoGuia } from "@/components/GuiaDeUso";
import { useEffect, useState } from "react";
import { Package, AlertTriangle, Layers, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SectionTitle } from "@/components/ui/typography";
import { obtenerArticulos, type Articulo } from "@/lib/api";
import PageHeader from "@/components/PageHeader";
import ManagementDashboard from "@/components/ManagementDashboard";
import { useAppStore } from "@/store/useAppStore";

export default function DashboardPage() {
  const rol = useAppStore(state => state.usuario?.rol);
  return rol === "Gerencia" ? <ManagementDashboard /> : <InventoryDashboard />;
}

function InventoryDashboard() {
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargarDatos = () => {
    setCargando(true);
    obtenerArticulos()
      .then(setArticulos)
      .catch(console.error)
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // --- CÁLCULOS ---
  const totalArticulos = articulos.length;
  const stockCritico = articulos.filter((a) => a.stock <= a.stockCritico).length;
  const categorias = new Set(articulos.map((a) => a.categoria)).size;

  // Datos para el gráfico de barras (Artículos por categoría)
  const porCategoria = articulos.reduce((acc, a) => {
    acc[a.categoria] = (acc[a.categoria] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const dataCategorias = Object.keys(porCategoria).map((cat) => ({
    name: cat,
    cantidad: porCategoria[cat],
  }));

  // Datos para el gráfico de torta (Distribución de stock)
  const disponible = totalArticulos - stockCritico;
  const dataStock = [
    { name: "Disponible", value: disponible },
    { name: "Stock Crítico", value: stockCritico },
  ];

  return (
    <div className="space-y-6">
      <PageHeader area="bodega" title="Panel de inventario" actions={
        <Button onClick={cargarDatos} variant="outline" disabled={cargando}>
          <RefreshCw className={`size-4 ${cargando ? "animate-spin" : ""}`} /> Actualizar datos
        </Button>
      } />

      <PuntoGuia id="indicadores-stock" />
      {/* TARJETAS DE RESUMEN */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Artículos registrados</p>
              <p className="mt-2 text-4xl font-bold">{totalArticulos}</p>
            </div>
            <div className="grid size-12 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
              <Package className="size-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Con stock crítico</p>
              <p className="mt-2 text-4xl font-bold">{stockCritico}</p>
            </div>
            <div className="grid size-12 place-items-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300">
              <AlertTriangle className="size-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Categorías</p>
              <p className="mt-2 text-4xl font-bold">{categorias}</p>
            </div>
            <div className="grid size-12 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300">
              <Layers className="size-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* GRÁFICOS Y ALERTAS */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Gráfico de Barras: Artículos por Categoría */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <PuntoGuia id="grafico-categorias" />
            <SectionTitle>Artículos por categoría</SectionTitle>
            <p className="text-sm text-muted-foreground">Cantidad de referencias por cada tipo de material.</p>
          </CardHeader>
          <CardContent className="h-[300px]">
            {dataCategorias.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataCategorias} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'var(--color-muted)' }}
                    contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}
                  />
                  <Bar dataKey="cantidad" fill="var(--color-primary)" radius={[4, 4, 0, 0]} maxBarSize={60} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="grid h-full place-items-center text-muted-foreground">No hay datos suficientes.</p>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Torta: Estado del Stock */}
        <Card>
          <CardHeader>
            <PuntoGuia id="grafico-stock" />
            <SectionTitle>Estado del Inventario</SectionTitle>
            <p className="text-sm text-muted-foreground">Distribución de artículos según su nivel de stock.</p>
          </CardHeader>
          <CardContent className="h-[300px] flex flex-col justify-center">
            {totalArticulos > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataStock}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {dataStock.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? "#10b981" : "#f59e0b"} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="grid h-full place-items-center text-muted-foreground">Sin inventario.</p>
            )}
            
            {/* Leyenda manual para el gráfico de torta */}
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="size-3 rounded-full bg-emerald-500"></span>
                <span className="text-muted-foreground">Disponible</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="size-3 rounded-full bg-amber-500"></span>
                <span className="text-muted-foreground">Crítico</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ALERTAS (Debajo de los gráficos) */}
      <Card>
        <CardHeader>
          <PuntoGuia id="alertas-stock" />
          <SectionTitle>Requieren atención</SectionTitle>
          <p className="text-sm text-muted-foreground">Artículos en su nivel mínimo o por debajo.</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {articulos.filter(a => a.stock <= a.stockCritico).map(a => (
              <div key={a._id} className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-900/20">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-amber-900 dark:text-amber-200">{a.nombre}</p>
                  <p className="font-bold text-amber-700 dark:text-amber-300">{a.stock} {a.unidad}</p>
                </div>
                <p className="text-xs text-amber-700/70 dark:text-amber-300/70 mt-1">{a.codigo} · Mínimo: {a.stockCritico} {a.unidad}</p>
              </div>
            ))}
            {stockCritico === 0 && (
              <p className="col-span-full text-center text-sm text-muted-foreground py-6">Todo el inventario está en orden.</p>
            )}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
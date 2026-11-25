import { toast } from "sonner";
import type { CeldaExportable } from "@/lib/exportFormat";
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SectionTitle } from "@/components/ui/typography";
import { useAppStore } from "@/store/useAppStore";
import { api, mensajeError, obtenerObras, obtenerPresupuestos } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { descargarExcel } from "@/lib/excelGenerator";
import { crearReporteOperacion, type ConteoEstado } from "@/lib/reporteOperacionExcel";
import { generarPDF } from "@/lib/pdfGenerator";
import { currency } from "@/lib/utils";

type Resumen = { operaciones: number; neto: number; iva: number; total: number };

function contarEstados(filas: { estado: string }[]): ConteoEstado[] {
  const conteo = new Map<string, number>();
  for (const { estado } of filas) conteo.set(estado, (conteo.get(estado) ?? 0) + 1);
  return Array.from(conteo, ([estado, cantidad]) => ({ estado, cantidad }));
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export default function ReportsPage() {
  const usuario = useAppStore((state) => state.usuario);
  const presupuestos = useAppStore((state) => state.presupuestos);
  const obras = useAppStore((state) => state.obras);

  const [resumenFinanzas, setResumenFinanzas] = useState<Resumen | null>(null);
  const fetchObras = useAppStore(state => state.fetchObras);
  const fetchPresupuestos = useAppStore(state => state.fetchPresupuestos);
  const [error, setError] = useState("");
  const [exportandoExcel, setExportandoExcel] = useState(false);
  const [cargando, setCargando] = useState(true);

  // 1. VALIDACIÓN DE ROL: Permitimos a Gerencia, Finanzas y Encargado de Bodega
  const puedeVerReportes =
    usuario?.rol === "Gerencia" ||
    usuario?.rol === "Finanzas" ||
    usuario?.rol === "Encargado de Bodega";

  useEffect(() => {
    if (puedeVerReportes) {
      api<Resumen>("/reportes/finanzas")
        .then((data) => setResumenFinanzas(data))
        .catch(err => setError(mensajeError(err)))
        .finally(() => setCargando(false));
    } else {
      setCargando(false);
    }
  }, [puedeVerReportes]);

  useEffect(() => {
    if (puedeVerReportes) void fetchObras();
    if (usuario?.rol === "Gerencia" || usuario?.rol === "Finanzas") void fetchPresupuestos();
  }, [puedeVerReportes, usuario?.rol, fetchObras, fetchPresupuestos]);

  if (!puedeVerReportes) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center">
        <h2 className="text-2xl font-bold">Acceso denegado</h2>
        <p className="mt-2 text-muted-foreground">No tienes permiso para ver los reportes del sistema.</p>
      </div>
    );
  }

  const presupuestosPorEstado = presupuestos.reduce((acc: any, p) => {
    acc[p.estado] = (acc[p.estado] || 0) + 1;
    return acc;
  }, {});

  const dataPresupuestos = Object.keys(presupuestosPorEstado).map((key) => ({
    name: key,
    cantidad: presupuestosPorEstado[key],
  }));

  const obrasPorEstado = obras.reduce((acc: any, o) => {
    acc[o.estado] = (acc[o.estado] || 0) + 1;
    return acc;
  }, {});

  const dataObras = Object.keys(obrasPorEstado).map((key) => ({
    name: key,
    value: obrasPorEstado[key],
  }));

  const exportar = async (formato: "pdf" | "excel") => {
    if (!resumenFinanzas) return;
    if (formato === "excel") {
      setExportandoExcel(true);
      try {
        const [compras, obrasActuales, presupuestosActuales] = await Promise.all([
          api<Resumen>("/reportes/finanzas"),
          obtenerObras(),
          usuario?.rol === "Encargado de Bodega" ? Promise.resolve(undefined) : obtenerPresupuestos(),
        ]);
        const libro = await crearReporteOperacion(compras, contarEstados(obrasActuales),
          presupuestosActuales && contarEstados(presupuestosActuales));
        await descargarExcel(libro, "reporte_FYAG");
      } catch (error) {
        toast.error(mensajeError(error));
      } finally {
        setExportandoExcel(false);
      }
      return;
    }
    const filas: CeldaExportable[][] = [
      ["Compras", resumenFinanzas.operaciones],
      ["Monto neto (CLP)", { clp: resumenFinanzas.neto }],
      ["IVA (CLP)", { clp: resumenFinanzas.iva }],
      ["Total gastado (CLP)", { clp: resumenFinanzas.total }],
      ...dataObras.map(({ name, value }) => [`Obras · ${name}`, value]),
      ...(usuario?.rol === "Encargado de Bodega" ? [] : dataPresupuestos.map(({ name, cantidad }) => [`Presupuestos · ${name}`, cantidad])),
    ];
    try {
      generarPDF("Reporte de operación", ["Indicador", "Valor"], filas, "reporte_FYAG");
    } catch {
      toast.error("No se pudo exportar el reporte de operación.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader area="finanzas" title="Reportes y Estadísticas" description="Resumen visual de la operación de FYAG." actions={<>
        <Button variant="outline" disabled={!resumenFinanzas} onClick={() => exportar("pdf")}>Exportar PDF</Button>
        <Button variant="outline" disabled={!resumenFinanzas || exportandoExcel} onClick={() => exportar("excel")}>{exportandoExcel ? "Preparando Excel…" : "Exportar Excel"}</Button>
      </>} />
      {cargando && <p role="status">Cargando reporte de compras…</p>}
      {error && <p role="alert">{error}</p>}

      {resumenFinanzas && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground">Total Operaciones (Compras)</p>
            <p className="mt-2 text-3xl font-bold">{resumenFinanzas?.operaciones || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground">Monto Neto</p>
            <p className="mt-2 text-2xl font-bold">{currency(resumenFinanzas?.neto || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground">IVA Total</p>
            <p className="mt-2 text-2xl font-bold">{currency(resumenFinanzas?.iva || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground">Total Gastado</p>
            <p className="mt-2 text-2xl font-bold text-primary">{currency(resumenFinanzas?.total || 0)}</p>
          </CardContent>
        </Card>
      </div>}

      <div className={usuario?.rol === "Encargado de Bodega" ? "grid gap-6" : "grid gap-6 lg:grid-cols-2"}>
        {usuario?.rol !== "Encargado de Bodega" && <Card>
          <CardHeader>
            <SectionTitle>Presupuestos por Estado</SectionTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {dataPresupuestos.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataPresupuestos}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: 'var(--color-muted)' }}
                    contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}
                    formatter={(value: any) => [`${value} presupuestos`, "Cantidad"]}
                  />
                  <Bar dataKey="cantidad" fill="#1e40af" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="grid h-full place-items-center text-muted-foreground">No hay datos de presupuestos.</p>
            )}
          </CardContent>
        </Card>}

        <Card>
          <CardHeader>
            <SectionTitle>Obras por Estado</SectionTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {dataObras.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataObras}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {dataObras.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="grid h-full place-items-center text-muted-foreground">No hay datos de obras.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
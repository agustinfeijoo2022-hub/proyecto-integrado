import { PuntoGuia } from "@/components/GuiaDeUso";
import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SectionTitle } from "@/components/ui/typography";
import { api } from "@/lib/api";

type ManagementSummary = {
  facturado: number;
  cobrado: number;
  porCobrar: number;
  compras: number;
  obras: { estado: string; cantidad: number }[];
};

const pesos = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" });

export default function ManagementDashboard() {
  const [summary, setSummary] = useState<ManagementSummary>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [version, refresh] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    api<ManagementSummary>("/dashboard/gerencia", { signal: controller.signal })
      .then(data => { if (!controller.signal.aborted) setSummary(data); })
      .catch(() => { if (!controller.signal.aborted) setError(true); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [version]);

  const indicators = summary && [
    { label: "Facturado", value: summary.facturado },
    { label: "Cobrado", value: summary.cobrado },
    { label: "Por cobrar", value: summary.porCobrar },
    { label: "Compras registradas", value: summary.compras },
  ];

  return (
    <div className="space-y-6" aria-busy={loading}>
      <PageHeader title="Panel gerencial" actions={
        <Button variant="outline" disabled={loading} onClick={() => refresh(value => value + 1)}>
          <RefreshCw className={loading ? "size-4 animate-spin" : "size-4"} /> Actualizar datos
        </Button>
      } />
      {error && <p role="alert" className="rounded-lg border border-border bg-card p-4">
        {summary ? "No se pudieron actualizar los indicadores. Se muestran los últimos datos disponibles."
          : "No se pudieron cargar los indicadores. Presiona Actualizar datos para reintentar."}
      </p>}
      {loading && !summary && <p role="status" className="text-muted-foreground">Cargando indicadores…</p>}
      <PuntoGuia id="indicadores-gerencia" />
      {!summary && <PuntoGuia id="grafico-gerencia" />}
      {summary && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {indicators?.map(({ label, value }) => (
              <Card key={label}>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="mt-2 text-2xl font-semibold tabular-nums">{pesos.format(value)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <PuntoGuia id="grafico-gerencia" />
          <Card>
            <CardHeader><SectionTitle>Obras por estado</SectionTitle></CardHeader>
            <CardContent>
              {summary.obras.length ? (
                <>
                  <div className="h-72 min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={summary.obras} layout="vertical" margin={{ right: 20 }}>
                        <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis type="number" allowDecimals={false} stroke="var(--color-muted-foreground)" />
                        <YAxis type="category" dataKey="estado" width={110} tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                        <Tooltip contentStyle={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-foreground)" }} />
                        <Bar dataKey="cantidad" name="Obras" fill="var(--color-primary)" maxBarSize={32} isAnimationActive={false} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                    {summary.obras.map(({ estado, cantidad }) => <li key={estado}>{estado} · {cantidad}</li>)}
                  </ul>
                </>
              ) : <p className="text-muted-foreground">Todavía no hay obras registradas.</p>}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

"use client";

import { bs, type Money } from "@/lib/money";
import { BarChart3 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useMonedaActiva, type UseMonedaActivaReturn } from "@/hooks/useMonedaActiva";

interface SpendingChartProps {
  gastosPorCategoria: {
    categoriaId: string;
    nombre: string;
    color: string;
    gastadoBs: Money;
    gastadoUsd: Money;
    porcentaje: number;
  }[];
}

function CustomTooltip({ active, payload, label, formatPair }: { active?: boolean; payload?: Array<{ value: number; payload: { color: string; montoBs: number; montoUsd: number } }>; label?: string; formatPair: UseMonedaActivaReturn["formatPair"] }) {
  if (!active || !payload?.length) return null;
  const pair = formatPair(bs(payload[0].payload.montoBs), bs(payload[0].payload.montoUsd));
  return (
    <div className="rounded-xl bg-surface-elevated border border-border px-4 py-3 shadow-xl">
      <div className="flex items-center gap-2 mb-1">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: payload[0].payload.color }} />
        <p className="text-xs text-muted">{label}</p>
      </div>
      <p className="text-sm font-bold text-foreground">{pair.primary}</p>
      <p className="text-xs text-muted">{pair.secondary}</p>
    </div>
  );
}

export default function SpendingChart({ gastosPorCategoria }: SpendingChartProps) {
  const { formatPair, moneda } = useMonedaActiva();
  const chartData = gastosPorCategoria.map((g) => ({
    name: g.nombre.length > 10 ? g.nombre.slice(0, 10) + "…" : g.nombre,
    monto: moneda === "USD" ? Number(g.gastadoUsd) : Number(g.gastadoBs),
    montoBs: Number(g.gastadoBs),
    montoUsd: Number(g.gastadoUsd),
    color: g.color,
  }));

  const formatTick = (v: number) => {
    const prefix = moneda === "USD" ? "$" : "Bs";
    if (v >= 1000) return `${prefix}${(v / 1000).toFixed(1)}k`;
    if (v >= 1) return `${prefix}${v.toFixed(0)}`;
    return `${prefix}0`;
  };

  return (
    <div className="rounded-2xl bg-surface border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">Gastos por categoría</h3>
          <p className="text-xs text-muted mt-0.5">Distribución del mes</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
          <BarChart3 className="h-4 w-4 text-primary" />
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-sm text-muted">
          Sin gastos este mes
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "var(--muted)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--muted)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={formatTick}
              />
              <Tooltip content={<CustomTooltip formatPair={formatPair} />} cursor={{ fill: "transparent" }} wrapperStyle={{ backgroundColor: "transparent" }} />
              <Bar dataKey="monto" radius={[6, 6, 0, 0]} maxBarSize={48} activeBar={{ fillOpacity: 1, stroke: "none" }}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {chartData.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-3">
          {gastosPorCategoria.map((g) => (
            <div key={g.categoriaId} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: g.color }} />
              <span className="text-xs text-muted">{g.nombre}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

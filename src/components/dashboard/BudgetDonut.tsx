"use client";

import { bs, type Money } from "@/lib/money";
import { PieChart as PieIcon } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useMonedaActiva, type UseMonedaActivaReturn } from "@/hooks/useMonedaActiva";

interface BudgetDonutProps {
  gastosPorCategoria: {
    categoriaId: string;
    nombre: string;
    color: string;
    gastadoBs: Money;
    gastadoUsd: Money;
    porcentaje: number;
  }[];
}

function CustomTooltip({ active, payload, formatPair }: { active?: boolean; payload?: Array<{ value: number; payload: { label: string; montoBs: number; montoUsd: number } }>; formatPair: UseMonedaActivaReturn["formatPair"] }) {
  if (!active || !payload?.length) return null;
  const pair = formatPair(bs(payload[0].payload.montoBs), bs(payload[0].payload.montoUsd));
  return (
    <div className="rounded-xl bg-surface-elevated border border-border px-4 py-3 shadow-xl">
      <p className="text-xs text-muted mb-1">{payload[0].payload.label}</p>
      <p className="text-sm font-bold text-foreground">{pair.primary}</p>
      <p className="text-xs text-muted">{pair.secondary}</p>
    </div>
  );
}

export default function BudgetDonut({ gastosPorCategoria }: BudgetDonutProps) {
  const { formatPair, moneda } = useMonedaActiva();
  const totalGastadoBs = gastosPorCategoria.reduce((a, g) => a + Number(g.gastadoBs), 0);
  const totalGastadoUsd = gastosPorCategoria.reduce((a, g) => a + Number(g.gastadoUsd), 0);
  const totalPair = formatPair(bs(totalGastadoBs), bs(totalGastadoUsd));

  const data = gastosPorCategoria.map((g) => ({
    name: g.nombre,
    value: moneda === "USD" ? Number(g.gastadoUsd) : Number(g.gastadoBs),
    montoBs: Number(g.gastadoBs),
    montoUsd: Number(g.gastadoUsd),
    label: g.nombre,
    color: g.color,
  }));

  return (
    <div className="rounded-2xl bg-surface border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">Presupuesto</h3>
          <p className="text-xs text-muted mt-0.5">Distribución de gastos</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/10">
          <PieIcon className="h-4 w-4 text-secondary" />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative h-44 w-44 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} className="transition-all duration-200 hover:opacity-80" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip formatPair={formatPair} />} wrapperStyle={{ backgroundColor: "transparent" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-xl font-bold text-foreground">{totalPair.primary}</p>
            <p className="text-[10px] text-muted">{totalPair.secondary}</p>
          </div>
        </div>

        <div className="flex-1 space-y-2.5">
          {gastosPorCategoria.map((g) => (
            <div key={g.categoriaId} className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: g.color }} />
              <span className="flex-1 text-sm text-foreground truncate">{g.nombre}</span>
              <span className="text-sm font-medium text-muted">{Math.round(g.porcentaje)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

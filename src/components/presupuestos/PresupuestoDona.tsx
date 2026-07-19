"use client";

import type { ResumenCobertura, Presupuesto } from "@/types/presupuesto";
import { bs } from "@/lib/money";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useMonedaActiva, type UseMonedaActivaReturn } from "@/hooks/useMonedaActiva";

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { label: string; color: string } }>;
  fromBs: UseMonedaActivaReturn["fromBs"];
}

function CustomTooltip({ active, payload, fromBs }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const data = payload[0];
  const pair = fromBs(bs(data.value));
  return (
    <div className="rounded-lg glass px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-foreground">{data.payload.label}</p>
      <p className="text-muted">{pair.primary}</p>
      <p className="text-muted/70">{pair.secondary}</p>
    </div>
  );
}

export default function PresupuestoDona(props: {
  cobertura: ResumenCobertura;
  presupuesto: Presupuesto;
}) {
  const { cobertura } = props;
  const { fromBs } = useMonedaActiva();

  const ingresoReal = Number(cobertura.ingresoRealBs);
  const gastoTotal = Number(cobertura.gastoTotalBs);
  const balance = Number(cobertura.balanceBs);

  const balancePair = fromBs(cobertura.balanceBs);
  const ingresoRealPair = fromBs(cobertura.ingresoRealBs);
  const gastoTotalPair = fromBs(cobertura.gastoTotalBs);

  const innerData = [
    { name: "Ingresos", value: Math.max(0, ingresoReal - gastoTotal), label: "Disponible", color: "#10B981" },
    { name: "Gastos", value: gastoTotal, label: "Gastado", color: "#EF4444" },
  ].filter((d) => d.value > 0);

  const outerData = cobertura.porCat.map((s) => ({
    name: s.nombre,
    value: Number(s.gastadoBs),
    label: s.nombre,
    color: s.color,
  })).filter((d) => d.value > 0);

  return (
    <div className="flex flex-col items-center">
      <div className="mt-3 text-center space-y-0.5">
        <p className={`text-3xl font-bold ${balance >= 0 ? "text-primary" : "text-danger"}`}>
          {balancePair.primary}
        </p>
        <p className="text-[10px] text-muted">{balancePair.secondary}</p>
        <p className="text-[10px] text-muted">Balance</p>
      </div>
      <div className="relative h-72 w-72 sm:h-80 sm:w-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={outerData}
              cx="50%"
              cy="50%"
              innerRadius={78}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={0}
            >
              {outerData.map((entry, i) => (
                <Cell key={i} fill={entry.color} className="transition-all duration-200 hover:opacity-80" />
              ))}
            </Pie>
            <Pie
              data={innerData}
              cx="50%"
              cy="50%"
              innerRadius={48}
              outerRadius={70}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {innerData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip fromBs={fromBs} />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 text-center space-y-0.5">
        <p className="text-xs text-muted">Ingresos: {ingresoRealPair.primary} <span className="text-muted/70">({ingresoRealPair.secondary})</span></p>
        <p className="text-xs text-muted">Gastos: {gastoTotalPair.primary} <span className="text-muted/70">({gastoTotalPair.secondary})</span></p>
      </div>
    </div>
  );
}

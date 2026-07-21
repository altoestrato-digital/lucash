"use client";

import type { ResumenHistorial } from "@/types/historial";
import { useMonedaActiva } from "@/hooks/useMonedaActiva";
import { ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react";

interface HistorialResumenProps {
  resumen: ResumenHistorial;
}

export default function HistorialResumen({ resumen }: HistorialResumenProps) {
  const { formatPair } = useMonedaActiva();
  const ingresos = formatPair(resumen.ingresosBs, resumen.ingresosUsd);
  const egresos = formatPair(resumen.egresosBs, resumen.egresosUsd);
  const balance = formatPair(resumen.balanceBs, resumen.balanceUsd);

  const items = [
    { label: "Ingresos", value: ingresos.primary, icon: ArrowUpRight, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Egresos", value: egresos.primary, icon: ArrowDownRight, color: "text-rose-500", bg: "bg-rose-500/10" },
    { label: "Balance", value: balance.primary, icon: TrendingUp, color: Number(resumen.balanceBs) >= 0 ? "text-emerald-500" : "text-rose-500", bg: Number(resumen.balanceBs) >= 0 ? "bg-emerald-500/10" : "bg-rose-500/10" },
  ];

  return (
    <div className="flex gap-3 px-4 pb-3 overflow-x-auto scrollbar-none">
      {items.map((item) => (
        <div key={item.label} className="flex-1 min-w-[110px] rounded-xl bg-surface border border-border p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${item.bg}`}>
              <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
            </div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted">{item.label}</p>
          </div>
          <p className={`text-base font-bold ${item.color}`}>{item.value}</p>
        </div>
      ))}
    </div>
  );
}

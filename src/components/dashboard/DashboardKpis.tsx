"use client";

import { TrendingUp, TrendingDown, Target, Wallet } from "lucide-react";
import type { Money } from "@/lib/money";
import { useMonedaActiva } from "@/hooks/useMonedaActiva";

interface DashboardKpisProps {
  disponible: { bs: Money; usd: Money };
  presupuestoPct: number;
  gastadoMesBs: Money;
  gastadoMesUsd: Money;
  totalBs: Money;
  totalUsd: Money;
  onDisponibleClick: () => void;
  onPresupuestoClick: () => void;
  onGastadoClick: () => void;
}

export default function DashboardKpis({
  disponible,
  presupuestoPct,
  gastadoMesBs,
  gastadoMesUsd,
  onDisponibleClick,
  onPresupuestoClick,
  onGastadoClick,
}: DashboardKpisProps) {
  const { formatPair } = useMonedaActiva();
  const disponiblePair = formatPair(disponible.bs, disponible.usd);
  const gastadoPair = formatPair(gastadoMesBs, gastadoMesUsd);
  const kpis = [
    {
      label: "Disponible",
      value: disponiblePair.primary,
      sub: disponiblePair.secondary,
      icon: Wallet,
      color: "from-emerald-500 to-emerald-600",
      iconBg: "bg-emerald-500/20",
      onClick: onDisponibleClick,
    },
    {
      label: "Presupuesto",
      value: `${Math.round(presupuestoPct)}%`,
      sub: "cubierto",
      icon: Target,
      color: presupuestoPct >= 100 ? "from-emerald-500 to-emerald-600" : "from-amber-500 to-amber-600",
      iconBg: presupuestoPct >= 100 ? "bg-emerald-500/20" : "bg-amber-500/20",
      onClick: onPresupuestoClick,
    },
    {
      label: "Gastado",
      value: gastadoPair.primary,
      sub: gastadoPair.secondary,
      icon: TrendingDown,
      color: "from-rose-500 to-rose-600",
      iconBg: "bg-rose-500/20",
      onClick: onGastadoClick,
    },
  ];

  return (
    <div className="px-4 lg:px-6">
      <div className="flex flex-col gap-3 lg:grid lg:grid-cols-3">
        {kpis.map((kpi) => (
          <button
            key={kpi.label}
            onClick={kpi.onClick}
            className="group w-full rounded-2xl bg-surface border border-border p-4 text-left transition-all duration-300 hover:border-border-hover hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${kpi.iconBg}`}>
                <kpi.icon className="h-5 w-5 text-foreground" />
              </div>
              <TrendingUp className="h-4 w-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted mb-1">{kpi.label}</p>
            <p className="text-xl font-bold text-foreground">{kpi.value}</p>
            <p className="text-xs text-muted mt-0.5">{kpi.sub}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

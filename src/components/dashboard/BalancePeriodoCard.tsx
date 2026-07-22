"use client";

import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { Money } from "@/lib/money";
import { useMonedaActiva } from "@/hooks/useMonedaActiva";
import { useBcvLookup } from "@/hooks/useBcvLookup";
import { toIso } from "@/lib/dates";

interface BalancePeriodoCardProps {
  ingresoMesBs: Money;
  ingresoMesUsd: Money;
  gastadoMesBs: Money;
  gastadoMesUsd: Money;
  balanceMesBs: Money;
  balanceMesUsd: Money;
}

export default function BalancePeriodoCard({
  ingresoMesBs,
  ingresoMesUsd,
  gastadoMesBs,
  gastadoMesUsd,
  balanceMesBs,
  balanceMesUsd,
}: BalancePeriodoCardProps) {
  const { formatPair, moneda } = useMonedaActiva();
  const hoy = toIso(new Date());
  const { valor: tasa } = useBcvLookup(hoy);

  const tasaNum = Number(tasa);

  const balanceBsNum = Number(balanceMesBs);

  const ingresoPair = formatPair(ingresoMesBs, ingresoMesUsd);
  const gastoPair = formatPair(gastadoMesBs, gastadoMesUsd);
  const balancePair = formatPair(balanceMesBs, balanceMesUsd);

  const contraparte = (bsVal: number, usdVal: number) => {
    if (moneda === "Bs") {
      return tasaNum > 0 ? `≈ ${(bsVal / tasaNum).toFixed(2)} USD` : "—";
    }
    return tasaNum > 0 ? `≈ ${(usdVal * tasaNum).toLocaleString("es-VE")} Bs` : "—";
  };

  return (
    <div className="px-4 lg:px-6">
      <div className="rounded-2xl bg-surface border border-border p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20">
            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
            <ArrowDownRight className="h-4 w-4 text-rose-500 -ml-1" />
          </div>
          <h3 className="text-sm font-medium text-foreground">Balance del período</h3>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-[10px] font-medium uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
              Ingresos
            </p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {ingresoPair.primary}
            </p>
            <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 mt-0.5">
              {contraparte(Number(ingresoMesBs), Number(ingresoMesUsd))}
            </p>
          </div>

          <div className="text-center p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
            <p className="text-[10px] font-medium uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-1">
              Egresos
            </p>
            <p className="text-lg font-bold text-rose-600 dark:text-rose-400">
              {gastoPair.primary}
            </p>
            <p className="text-[10px] text-rose-600/70 dark:text-rose-400/70 mt-0.5">
              {contraparte(Number(gastadoMesBs), Number(gastadoMesUsd))}
            </p>
          </div>

          <div className={`text-center p-3 rounded-xl border ${
            balanceBsNum >= 0
              ? "bg-blue-500/10 border-blue-500/20"
              : "bg-amber-500/10 border-amber-500/20"
          }`}>
            <p className={`text-[10px] font-medium uppercase tracking-wider mb-1 ${
              balanceBsNum >= 0
                ? "text-blue-600 dark:text-blue-400"
                : "text-amber-600 dark:text-amber-400"
            }`}>
              Balance
            </p>
            <p className={`text-lg font-bold ${
              balanceBsNum >= 0
                ? "text-blue-600 dark:text-blue-400"
                : "text-amber-600 dark:text-amber-400"
            }`}>
              {balancePair.primary}
            </p>
            <p className={`text-[10px] mt-0.5 ${
              balanceBsNum >= 0
                ? "text-blue-600/70 dark:text-blue-400/70"
                : "text-amber-600/70 dark:text-amber-400/70"
            }`}>
              {contraparte(Number(balanceMesBs), Number(balanceMesUsd))}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

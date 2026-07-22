"use client";

import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { Money } from "@/lib/money";
import { formatBs, formatUsd } from "@/lib/money";

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
  const balanceBsNum = Number(balanceMesBs);

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
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-[10px] font-medium uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">
              Ingresos
            </p>
            <div className="space-y-1">
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                {formatUsd(ingresoMesUsd)}
              </p>
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                {formatBs(ingresoMesBs)}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
            <p className="text-[10px] font-medium uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-2">
              Egresos
            </p>
            <div className="space-y-1">
              <p className="text-sm font-bold text-rose-600 dark:text-rose-400">
                {formatUsd(gastadoMesUsd)}
              </p>
              <p className="text-sm font-bold text-rose-600 dark:text-rose-400">
                {formatBs(gastadoMesBs)}
              </p>
            </div>
          </div>

          <div className={`p-3 rounded-xl border ${
            balanceBsNum >= 0
              ? "bg-blue-500/10 border-blue-500/20"
              : "bg-amber-500/10 border-amber-500/20"
          }`}>
            <p className={`text-[10px] font-medium uppercase tracking-wider mb-2 ${
              balanceBsNum >= 0
                ? "text-blue-600 dark:text-blue-400"
                : "text-amber-600 dark:text-amber-400"
            }`}>
              Balance
            </p>
            <div className="space-y-1">
              <p className={`text-sm font-bold ${
                balanceBsNum >= 0
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-amber-600 dark:text-amber-400"
              }`}>
                {formatUsd(balanceMesUsd)}
              </p>
              <p className={`text-sm font-bold ${
                balanceBsNum >= 0
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-amber-600 dark:text-amber-400"
              }`}>
                {formatBs(balanceMesBs)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

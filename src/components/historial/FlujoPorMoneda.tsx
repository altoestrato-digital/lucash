"use client";

import { ArrowUpRight, ArrowDownRight, DollarSign, Banknote } from "lucide-react";
import type { Money } from "@/lib/money";
import { formatBs, formatUsd } from "@/lib/money";

interface FlujoPorMonedaProps {
  ingresosBs: Money;
  ingresosUsd: Money;
  egresosBs: Money;
  egresosUsd: Money;
  balanceBs: Money;
  balanceUsd: Money;
}

export default function FlujoPorMoneda({
  ingresosBs,
  ingresosUsd,
  egresosBs,
  egresosUsd,
  balanceBs,
  balanceUsd,
}: FlujoPorMonedaProps) {
  const balanceBsNum = Number(balanceBs);
  const balanceUsdNum = Number(balanceUsd);

  return (
    <div className="px-4 py-3">
      <div className="rounded-2xl bg-surface border border-border p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20">
            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
            <ArrowDownRight className="h-4 w-4 text-rose-500 -ml-1" />
          </div>
          <h3 className="text-sm font-medium text-foreground">Flujo por moneda</h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Columna USD */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
            <div className="bg-zinc-100 dark:bg-zinc-800 px-3 py-2 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-zinc-500" />
              <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">USD</span>
            </div>
            <div className="p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Ingresos</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatUsd(ingresosUsd)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-rose-600 dark:text-rose-400">Egresos</span>
                <span className="text-sm font-bold text-rose-600 dark:text-rose-400">{formatUsd(egresosUsd)}</span>
              </div>
              <div className="h-px bg-zinc-200 dark:bg-zinc-700" />
              <div className="flex items-center justify-between">
                <span className={`text-[10px] uppercase tracking-wider ${balanceUsdNum >= 0 ? "text-blue-600 dark:text-blue-400" : "text-amber-600 dark:text-amber-400"}`}>Balance</span>
                <span className={`text-sm font-bold ${balanceUsdNum >= 0 ? "text-blue-600 dark:text-blue-400" : "text-amber-600 dark:text-amber-400"}`}>{formatUsd(balanceUsd)}</span>
              </div>
            </div>
          </div>

          {/* Columna Bs */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
            <div className="bg-zinc-100 dark:bg-zinc-800 px-3 py-2 flex items-center gap-2">
              <Banknote className="h-4 w-4 text-zinc-500" />
              <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Bs</span>
            </div>
            <div className="p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Ingresos</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatBs(ingresosBs)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-rose-600 dark:text-rose-400">Egresos</span>
                <span className="text-sm font-bold text-rose-600 dark:text-rose-400">{formatBs(egresosBs)}</span>
              </div>
              <div className="h-px bg-zinc-200 dark:bg-zinc-700" />
              <div className="flex items-center justify-between">
                <span className={`text-[10px] uppercase tracking-wider ${balanceBsNum >= 0 ? "text-blue-600 dark:text-blue-400" : "text-amber-600 dark:text-amber-400"}`}>Balance</span>
                <span className={`text-sm font-bold ${balanceBsNum >= 0 ? "text-blue-600 dark:text-blue-400" : "text-amber-600 dark:text-amber-400"}`}>{formatBs(balanceBs)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import type { Money } from "@/lib/money";
import { Wallet } from "lucide-react";
import { useMonedaActiva } from "@/hooks/useMonedaActiva";

interface CarterasHeaderProps {
  totalBs: Money;
  totalUsd: Money;
  disponibleBs: Money;
  disponibleUsd: Money;
  ahorroBs: Money;
  ahorroUsd: Money;
}

export default function CarterasHeader({ totalBs, totalUsd, disponibleBs, disponibleUsd, ahorroBs, ahorroUsd }: CarterasHeaderProps) {
  const { formatPair } = useMonedaActiva();
  const isLow = Number(disponibleBs) < Number(totalBs) * 0.2;
  const totalPair = formatPair(totalBs, totalUsd);
  const dispPair = formatPair(disponibleBs, disponibleUsd);
  const ahorroPair = formatPair(ahorroBs, ahorroUsd);

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 pt-12 pb-8 px-6">
      <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/5" />
      <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-white/5" />
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
            <Wallet className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Carteras</h1>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="w-full rounded-xl bg-white/10 backdrop-blur-sm p-3 lg:flex-1">
            <p className="text-[10px] font-medium uppercase tracking-wider text-emerald-100">Total</p>
            <p className="text-lg font-bold text-white">{totalPair.primary}</p>
            <p className="text-xs text-emerald-200">{totalPair.secondary}</p>
          </div>
          <div className={`w-full rounded-xl p-3 transition-all duration-300 lg:flex-1 ${isLow ? "bg-amber-500/20 border border-amber-400/30" : "bg-white/10 backdrop-blur-sm"}`}>
            <p className="text-[10px] font-medium uppercase tracking-wider text-emerald-100">Disponible</p>
            <p className={`text-lg font-bold ${isLow ? "text-amber-300" : "text-white"}`}>
              {dispPair.primary}
            </p>
            <p className={`text-xs ${isLow ? "text-amber-200" : "text-emerald-200"}`}>
              {dispPair.secondary}
            </p>
          </div>
          <div className="w-full rounded-xl bg-white/10 backdrop-blur-sm p-3 lg:flex-1">
            <p className="text-[10px] font-medium uppercase tracking-wider text-emerald-100">Ahorros</p>
            <p className="text-lg font-bold text-white">{ahorroPair.primary}</p>
            <p className="text-xs text-emerald-200">{ahorroPair.secondary}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

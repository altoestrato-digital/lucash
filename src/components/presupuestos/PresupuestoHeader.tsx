"use client";

import type { Presupuesto } from "@/types/presupuesto";
import type { Money } from "@/lib/money";
import { formatBs, formatUsd, bs } from "@/lib/money";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useMonedaActiva } from "@/hooks/useMonedaActiva";
import { convertirAUSD, convertirABs } from "@/lib/conversion";
import { toIso } from "@/lib/dates";

interface PresupuestoHeaderProps {
  presupuesto: Presupuesto;
  ingresoRealBs: Money;
  ingresoRealUsd: Money;
  gastoRealBs: Money;
  gastoRealUsd: Money;
}

export default function PresupuestoHeader({
  presupuesto,
  ingresoRealBs,
  ingresoRealUsd,
  gastoRealBs,
  gastoRealUsd,
}: PresupuestoHeaderProps) {
  const { moneda, formatPair } = useMonedaActiva();
  const hoy = toIso(new Date());

  const toDisplayFromAmount = (amount: number, amountMoneda: "Bs" | "USD"): { primary: string; secondary: string } => {
    if (moneda === "Bs") {
      if (amountMoneda === "Bs") {
        return { primary: formatBs(bs(amount)), secondary: formatUsd(convertirAUSD(amount, "Bs", hoy)) };
      } else {
        const bsEq = Number(convertirABs(bs(amount), hoy));
        return { primary: formatBs(bs(bsEq)), secondary: formatUsd(bs(amount)) };
      }
    } else {
      if (amountMoneda === "USD") {
        return { primary: formatUsd(bs(amount)), secondary: formatBs(convertirABs(bs(amount), hoy)) };
      } else {
        const usdEq = convertirAUSD(amount, "Bs", hoy);
        return { primary: formatUsd(usdEq), secondary: formatBs(bs(amount)) };
      }
    }
  };

  const ingresoDisplay = toDisplayFromAmount(Number(presupuesto.ingresoEsperado), presupuesto.ingresoEsperadoMoneda);
  const ingresoRealDisplay = formatPair(ingresoRealBs, ingresoRealUsd);

  const gastoMaxDisplay = toDisplayFromAmount(Number(presupuesto.gastoMaximoEsperado), presupuesto.gastoMaximoEsperadoMoneda);
  const gastoRealDisplay = formatPair(gastoRealBs, gastoRealUsd);

  const ingresoEsperadoBs = presupuesto.ingresoEsperadoMoneda === "Bs"
    ? Number(presupuesto.ingresoEsperado)
    : Number(convertirABs(bs(Number(presupuesto.ingresoEsperado)), hoy));
  const ingresoPct = ingresoEsperadoBs > 0 ? Math.min(100, (Number(ingresoRealBs) / ingresoEsperadoBs) * 100) : 0;

  const gastoMaximoBs = presupuesto.gastoMaximoEsperadoMoneda === "Bs"
    ? Number(presupuesto.gastoMaximoEsperado)
    : Number(convertirABs(bs(Number(presupuesto.gastoMaximoEsperado)), hoy));
  const gastoPct = gastoMaximoBs > 0 ? Math.min(100, (Number(gastoRealBs) / gastoMaximoBs) * 100) : 0;

  const gastoBarColor = gastoPct > 100
    ? "bg-red-400"
    : gastoPct > 80
      ? "bg-amber-400"
      : "bg-emerald-400";

  const gastoBarGlow = gastoPct > 100
    ? "shadow-red-500/40"
    : gastoPct > 80
      ? "shadow-amber-500/40"
      : "";

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 pt-12 pb-8 px-6">
      <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/5" />
      <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-white/5" />
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Presupuesto</h1>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="w-full rounded-xl bg-white/10 backdrop-blur-sm p-4 lg:flex-1">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-medium uppercase tracking-wider text-emerald-100">Ingreso esperado</p>
              <TrendingUp className="h-4 w-4 text-emerald-300" />
            </div>
            <p className="text-xl font-bold text-white">{ingresoRealDisplay.primary}</p>
            <p className="text-xs text-emerald-200 mb-2.5">de {ingresoDisplay.primary}</p>
            <div className="w-full h-1.5 bg-white/15 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all duration-700 ease-out"
                style={{ width: `${ingresoPct}%` }}
              />
            </div>
          </div>

          <div className={`w-full rounded-xl p-4 lg:flex-1 transition-all duration-300 ${gastoPct > 100 ? "bg-red-500/20 border border-red-400/30" : "bg-white/10 backdrop-blur-sm"}`}>
            <div className="flex items-center justify-between mb-2">
              <p className={`text-[10px] font-medium uppercase tracking-wider ${gastoPct > 100 ? "text-red-200" : "text-emerald-100"}`}>GASTO MAXIMO</p>
              <TrendingDown className={`h-4 w-4 ${gastoPct > 100 ? "text-red-300" : "text-emerald-200"}`} />
            </div>
            <p className={`text-xl font-bold ${gastoPct > 100 ? "text-red-300" : "text-white"}`}>{gastoRealDisplay.primary}</p>
            <p className={`text-xs mb-2.5 ${gastoPct > 100 ? "text-red-200" : "text-emerald-200"}`}>de {gastoMaxDisplay.primary}</p>
            <div className="w-full h-1.5 bg-white/15 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${gastoBarColor} ${gastoBarGlow}`}
                style={{ width: `${gastoPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

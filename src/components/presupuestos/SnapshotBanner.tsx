"use client";

import type { Presupuesto } from "@/types/presupuesto";
import { bs, usd } from "@/lib/money";
import { AlertTriangle } from "lucide-react";
import { useMonedaActiva } from "@/hooks/useMonedaActiva";

export default function SnapshotBanner({
  presupuesto,
  onEmpezarNuevo,
}: {
  presupuesto: Presupuesto;
  onEmpezarNuevo: () => void;
}) {
  const { formatPair } = useMonedaActiva();

  const totalLimites = presupuesto.categorias
    .filter((s) => s.activo)
    .reduce((acc, s) => acc + Number(s.limite), 0);

  const ingresos = Number(presupuesto.ingresoEsperado);
  const gastos = totalLimites;
  const balance = ingresos - gastos;

  const ingresoPair = formatPair(presupuesto.ingresoEsperado, usd(Number(presupuesto.ingresoEsperado) / 36));
  const gastoPair = formatPair(presupuesto.gastoMaximoEsperado, usd(Number(presupuesto.gastoMaximoEsperado) / 36));
  const balancePair = formatPair(bs(balance), usd(balance / 36));

  const periodoLabel = presupuesto.periodicidad === "mensual"
    ? "el mes"
    : presupuesto.periodicidad === "rango"
      ? "el rango"
      : "el periodo";

  return (
    <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 space-y-3" role="alert">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
        </div>
        <div>
          <p className="font-semibold text-foreground">
            Se cerró {periodoLabel}
          </p>
          <p className="text-sm text-muted mt-1">
            {ingresoPair.primary} ingresos · {gastoPair.primary} gastos · {balance >= 0 ? "superávit" : "déficit"} de {balancePair.primary}
          </p>
        </div>
      </div>
      <button
        onClick={onEmpezarNuevo}
        className="w-full sm:w-auto rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium px-4 py-2.5 text-sm transition-all duration-200 hover:scale-[1.01] active:scale-[0.98]"
      >
        Empezar nuevo periodo
      </button>
    </div>
  );
}

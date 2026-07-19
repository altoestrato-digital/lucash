"use client";

import { useState } from "react";
import { Shield, AlertTriangle, CheckCircle } from "lucide-react";
import type { Money } from "@/lib/money";
import { bs } from "@/lib/money";
import { useMonedaActiva } from "@/hooks/useMonedaActiva";

interface QuickTestProps {
  disponible: { bs: Money; usd: Money };
  total: { bs: Money; usd: Money };
  carterasNoLiquidas: { id: string; nombre: string; tipo: string; saldo: number; moneda: string }[];
}

export default function QuickTest({ disponible, total, carterasNoLiquidas }: QuickTestProps) {
  const { moneda, formatPair, fromBs, fromCartera } = useMonedaActiva();
  const [monto, setMonto] = useState("");
  const montoNum = parseFloat(monto) || 0;

  const isUSD = moneda === "USD";
  const disp = isUSD ? Number(disponible.usd) : Number(disponible.bs);
  const tot = isUSD ? Number(total.usd) : Number(total.bs);
  const dispPair = formatPair(disponible.bs, disponible.usd);
  const totalPair = formatPair(total.bs, total.usd);
  const faltaDisponible = montoNum - disp;
  const faltaDisponiblePair = isUSD
    ? fromCartera(faltaDisponible, "USD")
    : fromBs(bs(faltaDisponible));
  const faltaTotal = montoNum - tot;
  const faltaTotalPair = isUSD
    ? fromCartera(faltaTotal, "USD")
    : fromBs(bs(faltaTotal));

  const estado = montoNum <= 0 ? "idle" : montoNum <= disp ? "verde" : montoNum <= tot ? "amarillo" : "rojo";

  return (
    <div className="rounded-2xl bg-surface border border-border p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
          <Shield className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-foreground">Test de imprevisto</h3>
          <p className="text-xs text-muted">¿Podés cubrir un gasto inesperado?</p>
        </div>
      </div>

      <div className="relative mb-4">
        <input
          type="number"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          placeholder={isUSD ? "Ingresá un monto en USD" : "Ingresá un monto en Bs"}
          className="w-full rounded-xl border border-border bg-surface-elevated px-4 py-3 pr-12 text-lg font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
        />
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted">{isUSD ? "USD" : "Bs"}</span>
      </div>

      {estado === "verde" && (
        <div className="flex items-start gap-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 animate-scale-in">
          <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
          <p className="text-sm text-emerald-600">
            Sí, podés cubrirlo con tu disponible de <span className="font-semibold">{dispPair.primary}</span>
            <span className="text-emerald-500/80"> ({dispPair.secondary})</span>.
          </p>
        </div>
      )}

      {estado === "amarillo" && (
        <div className="flex items-start gap-3 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 animate-scale-in">
          <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm text-amber-600">
              No alcanza con el disponible ({dispPair.primary} · {dispPair.secondary}), pero sí con el total.
            </p>
            <p className="text-xs text-amber-500 mt-1">
              Te faltan <span className="font-semibold">{faltaDisponiblePair.primary}</span> <span className="text-amber-400">({faltaDisponiblePair.secondary})</span>. Mové fondos de:
            </p>
            <ul className="mt-1 space-y-0.5">
              {carterasNoLiquidas
                .filter((c) => c.saldo > 0)
                .map((c) => (
                  <li key={c.id} className="text-xs text-amber-500">• {c.nombre} ({c.tipo}) — {c.saldo} {c.moneda}</li>
                ))}
            </ul>
          </div>
        </div>
      )}

      {estado === "rojo" && (
        <div className="flex items-start gap-3 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 animate-scale-in">
          <AlertTriangle className="h-5 w-5 text-rose-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm text-rose-600">
              No podés cubrirlo. El total ({totalPair.primary} · {totalPair.secondary}) no alcanza.
            </p>
            <p className="text-xs text-rose-500 mt-1">
              Te faltan {faltaTotalPair.primary} <span className="text-rose-400">({faltaTotalPair.secondary})</span>.
            </p>
          </div>
        </div>
      )}

      {estado === "idle" && (
        <div className="rounded-xl bg-surface-elevated p-3">
          <p className="text-xs text-muted text-center">Escribí un monto para verificar si podés cubrirlo</p>
        </div>
      )}
    </div>
  );
}

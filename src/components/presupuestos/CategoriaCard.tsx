"use client";

import type { CoberturaCategoria } from "@/types/presupuesto";
import { formatBs, formatUsd } from "@/lib/money";
import { useMonedaActiva } from "@/hooks/useMonedaActiva";

const prioridadColors: Record<number, string> = {
  1: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  2: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  3: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
};

const statusConfig: Record<string, { label: string; classes: string }> = {
  "cubierto":   { label: "Cubierto",   classes: "bg-primary/10 text-primary" },
  "parcial":    { label: "Parcial",    classes: "bg-secondary/10 text-secondary" },
  "no-cubierto":{ label: "No cubierto", classes: "bg-muted/10 text-muted" },
  "excedido":   { label: "Excedido",   classes: "bg-danger/10 text-danger" },
};

export default function CategoriaCard({ cat }: { cat: CoberturaCategoria }) {
  const { moneda, fromBs } = useMonedaActiva();

  const pct = Number(cat.limiteBs) > 0
    ? Math.min(100, (Number(cat.gastadoBs) / Number(cat.limiteBs)) * 100)
    : 0;

  const status = statusConfig[cat.estado] || statusConfig["no-cubierto"];

  const displayPair = fromBs(cat.limiteBs);
  const gastadoPair = fromBs(cat.gastadoBs);

  return (
    <div className="py-3 px-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
          <span className="font-medium text-sm text-foreground">
            {cat.nombre}
          </span>
        </div>
        {cat.prioridad && (
          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${prioridadColors[cat.prioridad]}`}>
            P{cat.prioridad}
          </span>
        )}
      </div>

      <div className="w-full h-2 bg-surface-elevated rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            backgroundColor: cat.estado === "excedido" ? "var(--danger)" : cat.estado === "cubierto" ? "var(--primary)" : "var(--secondary)",
          }}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-muted">
          <span className="font-mono">{gastadoPair.primary}</span>
          <span className="mx-1">/</span>
          <span className="font-mono">{displayPair.primary}</span>
          <span className="ml-1 text-muted/60">({pct.toFixed(0)}%)</span>
          {cat.limiteMoneda !== moneda && (
            <span className="ml-1 text-muted/40">
              · {cat.limiteMoneda === "USD" ? formatUsd(cat.limiteOriginal) : formatBs(cat.limiteOriginal)}
            </span>
          )}
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${status.classes}`}>
          {status.label}
        </span>
      </div>
    </div>
  );
}

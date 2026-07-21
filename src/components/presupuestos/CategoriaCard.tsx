"use client";

import { useState } from "react";
import type { CoberturaCategoria, CategoriaDetalle } from "@/types/presupuesto";
import { formatBs, formatUsd } from "@/lib/money";
import { useMonedaActiva } from "@/hooks/useMonedaActiva";
import { ChevronRight } from "lucide-react";
import { PRIORIDAD_BADGE_CLASSES } from "@/lib/presupuesto-styles";
import DetalleList from "./DetalleList";

const statusConfig: Record<string, { label: string; classes: string }> = {
  "cubierto":   { label: "Cubierto",   classes: "bg-primary/10 text-primary" },
  "parcial":    { label: "Parcial",    classes: "bg-secondary/10 text-secondary" },
  "no-cubierto":{ label: "No cubierto", classes: "bg-muted/10 text-muted" },
  "excedido":   { label: "Excedido",   classes: "bg-danger/10 text-danger" },
};

export default function CategoriaCard({ cat, detalles }: { cat: CoberturaCategoria; detalles?: CategoriaDetalle[] }) {
  const { moneda, fromBs } = useMonedaActiva();
  const [expanded, setExpanded] = useState(false);
  const hasDetalles = detalles && detalles.length > 0;

  const pct = Number(cat.limiteBs) > 0
    ? Math.min(100, (Number(cat.gastadoBs) / Number(cat.limiteBs)) * 100)
    : 0;

  const status = statusConfig[cat.estado] || statusConfig["no-cubierto"];

  const displayPair = fromBs(cat.limiteBs);
  const gastadoPair = fromBs(cat.gastadoBs);

  return (
    <div
      className={`py-3 px-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 space-y-3 transition-all ${hasDetalles ? "cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-600" : ""}`}
      onClick={hasDetalles ? () => setExpanded((e) => !e) : undefined}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
          <span className="font-medium text-sm text-foreground">
            {cat.nombre}
          </span>
          {hasDetalles && (
            <ChevronRight className={`w-3.5 h-3.5 text-muted transition-transform duration-200 ${expanded ? "rotate-90" : ""}`} />
          )}
        </div>
        {cat.prioridad && (
          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${PRIORIDAD_BADGE_CLASSES[cat.prioridad]}`}>
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

      {expanded && hasDetalles && (
        <DetalleList detalles={detalles} variant="card" onItemClick={(e) => e.stopPropagation()} />
      )}
    </div>
  );
}

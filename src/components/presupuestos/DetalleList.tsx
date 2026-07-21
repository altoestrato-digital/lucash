"use client";

import type { CategoriaDetalle } from "@/types/presupuesto";
import { useMonedaActiva } from "@/hooks/useMonedaActiva";

type Variant = "card" | "row";

export default function DetalleList({
  detalles,
  variant = "row",
  onItemClick,
}: {
  detalles: CategoriaDetalle[];
  variant?: Variant;
  onItemClick?: (e: React.MouseEvent) => void;
}) {
  const { fromBs, fromCartera } = useMonedaActiva();
  const containerClass = variant === "card"
    ? "pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-1.5"
    : "px-4 py-2 bg-zinc-50 dark:bg-zinc-800/30 border-t border-zinc-100 dark:border-zinc-800 space-y-1.5";
  const itemClass = variant === "card"
    ? "flex items-center gap-2 py-1.5 px-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50"
    : "flex items-center gap-2 py-1.5 px-2 rounded-lg bg-white dark:bg-zinc-800/50";

  return (
    <div className={containerClass} onClick={onItemClick}>
      {detalles.map((d) => {
        const pair = d.moneda === "Bs" ? fromBs(d.montoEstimado) : fromCartera(Number(d.montoEstimado), d.moneda);
        return (
          <div key={d.id} className={itemClass}>
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
            <span className="flex-1 text-xs text-zinc-700 dark:text-zinc-300 truncate">{d.nombre}</span>
            <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">{pair.primary}</span>
          </div>
        );
      })}
    </div>
  );
}

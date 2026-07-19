"use client";

import { useState } from "react";
import type { MovimientoCartera, Cartera } from "@/types/cartera";
import { formatDateTime } from "@/lib/dates";

interface MovimientoCarteraListProps {
  movimientos: MovimientoCartera[];
  carteras: Cartera[];
}

const TIPO_ICON: Record<string, { color: string; label: string }> = {
  "conversion-salida": { color: "text-red-500", label: "Salida" },
  "conversion-entrada": { color: "text-emerald-500", label: "Entrada" },
  ajuste: { color: "text-gray-400", label: "Ajuste" },
};

const PAGE_SIZE = 10;

export default function MovimientoCarteraList({ movimientos, carteras }: MovimientoCarteraListProps) {
  const [limit, setLimit] = useState(PAGE_SIZE);
  const sorted = [...movimientos].sort((a, b) => b.fecha.localeCompare(a.fecha));
  const visible = sorted.slice(0, limit);

  const carteraName = (id: string) => carteras.find((c) => c.id === id)?.nombre ?? "—";

  if (movimientos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <p className="text-sm text-zinc-400 dark:text-zinc-500">Sin movimientos</p>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-1">
        {visible.map((m) => {
          const info = TIPO_ICON[m.tipo] ?? { color: "text-gray-400", label: m.tipo };
          return (
            <div
              key={m.id}
              className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800/50"
            >
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium ${info.color}`}>{info.label}</span>
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{formatDateTime(m.fecha)}</p>
                  {m.carteraContraparteId && (
                    <p className="text-xs text-zinc-400">{carteraName(m.carteraContraparteId)}</p>
                  )}
                  {m.descripcion && (
                    <p className="text-xs text-zinc-400 italic">{m.descripcion}</p>
                  )}
                </div>
              </div>
              <span className={`text-sm font-semibold ${
                (m.tipo === "conversion-entrada" || (m.tipo === "ajuste" && m.monto >= 0))
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              }`}>
                {(m.tipo === "conversion-entrada" || (m.tipo === "ajuste" && m.monto >= 0)) ? "+" : "-"}
                {m.tipo === "ajuste" ? Math.abs(m.monto).toLocaleString() : m.monto.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>
      {limit < sorted.length && (
        <button
          className="mt-3 w-full py-2 text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          onClick={() => setLimit(limit + PAGE_SIZE)}
        >
          Cargar más ({sorted.length - limit} restantes)
        </button>
      )}
    </div>
  );
}

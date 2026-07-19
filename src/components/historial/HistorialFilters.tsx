"use client";

import type { FiltroHistorial } from "@/types/historial";
import type { Cartera } from "@/types/cartera";
import { X } from "lucide-react";

interface HistorialFiltersProps {
  open: boolean;
  filtro: FiltroHistorial;
  presupuesto: { subpresupuestos: { id: string; nombre: string; activo: boolean }[] } | null;
  carteras: Cartera[];
  onTipoChange: (t: FiltroHistorial["tipo"]) => void;
  onSubChange: (s: FiltroHistorial["subPresupuestoId"]) => void;
  onCarteraChange: (c: FiltroHistorial["carteraId"]) => void;
  onClose: () => void;
}

export default function HistorialFilters({
  open,
  filtro,
  presupuesto,
  carteras,
  onTipoChange,
  onSubChange,
  onCarteraChange,
  onClose,
}: HistorialFiltersProps) {
  if (!open) return null;

  const subs = presupuesto?.subpresupuestos?.filter((s) => s.activo) ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full rounded-t-2xl bg-surface border-t border-border px-4 pb-8 pt-6">
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-border" />

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Filtros</h2>
          <button onClick={onClose} className="text-muted hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4">
          <p className="mb-2 text-sm font-medium text-muted">Tipo</p>
          <div className="flex gap-2">
            {(["todos", "ingreso", "egreso"] as FiltroHistorial["tipo"][]).map((t) => (
              <button
                key={t}
                onClick={() => onTipoChange(t)}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                  filtro.tipo === t
                    ? "bg-primary text-white shadow-sm"
                    : "bg-surface-elevated text-muted hover:text-foreground border border-border"
                }`}
              >
                {t === "todos" ? "Todos" : t === "ingreso" ? "Ingreso" : "Egreso"}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <p className="mb-2 text-sm font-medium text-muted">Sub-presupuesto</p>
          <select
            value={filtro.subPresupuestoId}
            onChange={(e) => onSubChange(e.target.value as FiltroHistorial["subPresupuestoId"])}
            className="w-full rounded-xl border border-border bg-surface-elevated px-3 py-2.5 text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          >
            <option value="todos">Todos</option>
            <option value="general">Presupuesto general</option>
            {subs.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <p className="mb-2 text-sm font-medium text-muted">Cartera</p>
          <select
            value={filtro.carteraId}
            onChange={(e) => onCarteraChange(e.target.value as FiltroHistorial["carteraId"])}
            className="w-full rounded-xl border border-border bg-surface-elevated px-3 py-2.5 text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          >
            <option value="todos">Todos</option>
            {carteras.filter((c) => c.activo).map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-xl gradient-primary py-3 text-sm font-medium text-white shadow-lg glow-primary hover:scale-[1.01] active:scale-[0.98] transition-all"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

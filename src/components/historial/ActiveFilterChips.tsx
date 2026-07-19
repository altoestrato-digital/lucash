"use client";

import type { FiltroHistorial } from "@/types/historial";
import { X } from "lucide-react";

interface ActiveFilterChipsProps {
  filtro: FiltroHistorial;
  onRemoveTipo: () => void;
  onRemoveSub: () => void;
  onRemoveCartera: () => void;
}

export default function ActiveFilterChips({ filtro, onRemoveTipo, onRemoveSub, onRemoveCartera }: ActiveFilterChipsProps) {
  const chips: { label: string; onRemove: () => void }[] = [];

  if (filtro.tipo !== "todos") {
    chips.push({ label: filtro.tipo === "ingreso" ? "Ingreso" : "Egreso", onRemove: onRemoveTipo });
  }
  if (filtro.subPresupuestoId !== "todos") {
    chips.push({
      label: filtro.subPresupuestoId === "general" ? "Presupuesto general" : filtro.subPresupuestoId,
      onRemove: onRemoveSub,
    });
  }
  if (filtro.carteraId !== "todos") {
    chips.push({ label: filtro.carteraId, onRemove: onRemoveCartera });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-4 pb-2">
      {chips.map((chip) => (
        <span
          key={chip.label}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-medium text-primary"
        >
          {chip.label}
          <button onClick={chip.onRemove} className="text-primary/60 hover:text-primary transition-colors" aria-label={`Quitar filtro ${chip.label}`}>
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
    </div>
  );
}

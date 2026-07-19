"use client";

import { useState } from "react";
import type { Periodo } from "@/types/historial";
import type { ISODate } from "@/lib/dates";

interface PeriodoSelectorProps {
  value: string;
  onChange: (periodo: Periodo) => void;
}

export default function PeriodoSelector({ value, onChange }: PeriodoSelectorProps) {
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const hoy = new Date().toISOString().slice(0, 10);

  const opciones = [
    { id: "presupuesto", label: "Presupuesto" },
    { id: "rango", label: "Rango" },
    { id: "todas", label: "Todas" },
  ];

  const handlePresupuesto = () => onChange({ tipo: "presupuesto" });
  const handleTodas = () => onChange({ tipo: "todas" });
  const handleRango = () => {
    setDesde("");
    setHasta("");
    onChange({ tipo: "rango" });
  };

  const aplicarRango = () => {
    if (desde && hasta && desde <= hasta && hasta <= hoy) {
      onChange({ tipo: "rango", desde: desde as ISODate, hasta: hasta as ISODate });
    }
  };

  const noAplicar = !desde || !hasta || desde > hasta || hasta > hoy;

  return (
    <div className="px-4 py-3">
      <div className="flex rounded-xl bg-surface border border-border p-1">
        {opciones.map((o) => (
          <button
            key={o.id}
            onClick={() => {
              if (o.id === "presupuesto") handlePresupuesto();
              else if (o.id === "todas") handleTodas();
              else handleRango();
            }}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all duration-200 ${
              value === o.id
                ? "bg-primary text-white shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {value === "rango" && (
        <div className="mt-3 flex items-end gap-2">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-muted">Desde</label>
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-muted">Hasta</label>
            <input
              type="date"
              value={hasta}
              max={hoy}
              onChange={(e) => setHasta(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <button
            onClick={aplicarRango}
            disabled={noAplicar}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-40 hover:bg-primary-dark transition-colors"
          >
            Aplicar
          </button>
        </div>
      )}
    </div>
  );
}

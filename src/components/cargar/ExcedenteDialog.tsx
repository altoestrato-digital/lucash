"use client";

import { useState } from "react";
import type { Cartera, CarteraId } from "@/types/cartera";
import { formatBs } from "@/lib/money";
import type { Money } from "@/lib/money";
import { AlertTriangle, Check } from "lucide-react";

interface Props {
  open: boolean;
  excedenteBs: number;
  carterasAhorro: Cartera[];
  onConfirm: (carteraId: CarteraId) => void;
  onCancel: () => void;
  onCrearCartera: () => void;
}

export default function ExcedenteDialog({ open, excedenteBs, carterasAhorro, onConfirm, onCancel, onCrearCartera }: Props) {
  const [selectedId, setSelectedId] = useState<CarteraId | null>(null);

  if (!open) return null;

  const handleConfirm = () => {
    if (selectedId) onConfirm(selectedId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-t-2xl sm:rounded-2xl bg-surface border border-border p-6 animate-in slide-in-from-bottom">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            ¡Te pasaste del presupuesto!
          </h2>
        </div>
        <p className="text-sm text-muted mb-4">
          El excedente de <strong className="text-foreground">{formatBs(excedenteBs as Money)}</strong> puede redirigirse a una cartera de ahorro.
        </p>

        {selectedId ? null : (
          <p className="text-xs text-muted mb-3">Elegí el destino del excedente:</p>
        )}

        {carterasAhorro.length === 0 ? (
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 mb-4">
            <p className="text-sm text-amber-500 mb-2">No tenés carteras de ahorro activas.</p>
            <button
              onClick={onCrearCartera}
              className="w-full rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 transition-colors"
            >
              Crear cartera de ahorro
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 mb-4 max-h-48 overflow-y-auto">
            {carterasAhorro.map((cartera) => (
              <button
                key={cartera.id}
                onClick={() => setSelectedId(cartera.id)}
                className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                  selectedId === cartera.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-surface-elevated"
                }`}
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cartera.color }}
                />
                <span className="text-sm font-medium text-foreground flex-1">{cartera.nombre}</span>
                {selectedId === cartera.id && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-surface-elevated transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedId}
            className="flex-1 rounded-xl gradient-primary px-4 py-2.5 text-sm font-medium text-white shadow-lg glow-primary hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

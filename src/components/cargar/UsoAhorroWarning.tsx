"use client";

import { AlertTriangle, TrendingUp } from "lucide-react";
import type { TipoTransaccion } from "@/types/transaccion";

interface Props {
  open: boolean;
  tipo?: TipoTransaccion;
  metaNombre?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function UsoAhorroWarning({ open, tipo, metaNombre, onConfirm, onCancel }: Props) {
  if (!open) return null;

  const isIngreso = tipo === "ingreso";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-t-2xl sm:rounded-2xl bg-surface border border-border p-6 animate-in slide-in-from-bottom">
        <div className="flex items-center gap-3 mb-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isIngreso ? "bg-emerald-500/10" : "bg-amber-500/10"}`}>
            {isIngreso ? (
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            )}
          </div>
          <h2 className="text-lg font-semibold text-foreground">Cuenta de ahorro</h2>
        </div>
        {isIngreso ? (
          <p className="text-sm text-muted mb-1">
            Al realizar esta transferencia te acercás más a alcanzar tu meta
            {metaNombre ? (
              <>
                {" "}
                <strong className="text-foreground">&quot;{metaNombre}&quot;</strong>
              </>
            ) : null}
            .
          </p>
        ) : (
          <p className="text-sm text-muted mb-1">
            Estás usando una cuenta de ahorro. Esto reduce el progreso de tu meta
            {metaNombre ? (
              <>
                {" "}
                <strong className="text-foreground">&quot;{metaNombre}&quot;</strong>
              </>
            ) : null}
            .
          </p>
        )}
        <p className="text-sm text-muted mb-6">¿Continuar?</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-surface-elevated transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-xl gradient-primary px-4 py-2.5 text-sm font-medium text-white shadow-lg glow-primary hover:scale-[1.01] active:scale-[0.98] transition-all"
          >
            Sí, continuar
          </button>
        </div>
      </div>
    </div>
  );
}

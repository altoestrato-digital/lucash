"use client";

import { useState } from "react";
import { useDolarApiForDate, useFuenteTasa } from "@/hooks/useDolarApiForDate";
import { useDolarApiStore } from "@/stores/dolar-api";
import { formatDate, extractDate } from "@/lib/dates";
import { tasasBcvRepo } from "@/lib/db";
import type { ISODate } from "@/lib/dates";
import { Pencil, RefreshCw } from "lucide-react";

interface Props {
  fecha: string;
  value: string;
  onChange: (v: string) => void;
}

export default function TasaBcvField({ fecha, value, onChange }: Props) {
  const fechaDate = extractDate(fecha as ISODate);
  const { oficial, paralelo, activa, fuenteActiva } = useDolarApiForDate(fechaDate);
  const { setFuente } = useFuenteTasa();
  const fetchFn = useDolarApiStore((s) => s.fetch);
  const loading = useDolarApiStore((s) => s.loading);

  const [manualMode, setManualMode] = useState(false);

  const hasApi = oficial != null || paralelo != null;
  const apiValue = activa;
  const fuenteLabel = fuenteActiva === "oficial" ? "BCV" : "paralelo";

  const enterManual = () => {
    setManualMode(true);
  };

  const exitManual = () => {
    setManualMode(false);
    onChange("");
  };

  const handleManualChange = (v: string) => {
    onChange(v);
    const num = parseFloat(v);
    if (!isNaN(num) && num > 0) {
      tasasBcvRepo.set(fechaDate, num, "manual");
    }
  };

  if (manualMode) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">Tasa manual</label>
          {hasApi && (
            <button
              type="button"
              onClick={exitManual}
              className="text-[11px] font-medium text-muted hover:text-foreground transition-colors"
            >
              Volver a la automática
            </button>
          )}
        </div>
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => handleManualChange(e.target.value)}
          placeholder="Ingrese la tasa manualmente"
          className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2.5 text-sm text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
    );
  }

  if (apiValue != null) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">Tasa {fuenteLabel}</label>
          <div className="flex items-center gap-2">
            {oficial != null && paralelo != null && (
              <button
                type="button"
                onClick={() => setFuente(fuenteActiva === "oficial" ? "paralelo" : "oficial", fechaDate)}
                className="text-[11px] font-medium text-muted hover:text-foreground transition-colors"
              >
                Ver {fuenteActiva === "oficial" ? "paralelo" : "oficial"}
              </button>
            )}
            <button
              type="button"
              onClick={enterManual}
              className="text-muted hover:text-foreground transition-colors"
              aria-label="Editar manualmente"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => void fetchFn(fechaDate)}
              disabled={loading}
              className="text-muted hover:text-foreground transition-colors disabled:opacity-40"
              aria-label="Actualizar tasa"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-elevated px-3 py-2.5 text-sm text-foreground">
          <svg className="w-4 h-4 flex-shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className="flex-1 font-mono">{apiValue.toFixed(2)}</span>
          <span className="text-xs text-muted">
            {fuenteLabel} · {formatDate(fechaDate)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">Tasa BCV</label>
        <button
          type="button"
          onClick={() => void fetchFn(fechaDate)}
          disabled={loading}
          className="text-[11px] font-medium text-muted hover:text-foreground transition-colors disabled:opacity-40 flex items-center gap-1"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          Buscar tasa
        </button>
      </div>
      <div className="space-y-1">
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => handleManualChange(e.target.value)}
          placeholder="Ingrese la tasa manualmente"
          className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2.5 text-sm text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.07 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          No se encontró tasa automática para esta fecha
        </p>
      </div>
    </div>
  );
}

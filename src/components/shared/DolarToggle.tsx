"use client";

import { useEffect, useRef } from "react";
import { RefreshCw } from "lucide-react";
import { useDolarApiStore } from "@/stores/dolar-api";
import { useDolarApiForDate, useFuenteTasa } from "@/hooks/useDolarApiForDate";
import { toIso } from "@/lib/dates";

interface DolarToggleProps {
  className?: string;
  ariaLabel?: string;
}

export default function DolarToggle({
  className = "",
  ariaLabel = "Cambiar entre dólar oficial y paralelo",
}: DolarToggleProps) {
  const fecha = toIso(new Date());
  const { fuente, setFuente } = useFuenteTasa();
  const fetchFn = useDolarApiStore((s) => s.fetch);
  const loading = useDolarApiStore((s) => s.loading);
  const error = useDolarApiStore((s) => s.error);
  const { oficial, paralelo, activa } = useDolarApiForDate(fecha);

  const fetchedRef = useRef(false);
  useEffect(() => {
    if (fetchedRef.current) return;
    if (loading) return;
    if (oficial != null || paralelo != null) {
      fetchedRef.current = true;
      return;
    }
    fetchedRef.current = true;
    void fetchFn(fecha);
  }, [fetchFn, loading, oficial, paralelo, fecha]);

  const handleToggle = () => {
    const next = fuente === "oficial" ? "paralelo" : "oficial";
    setFuente(next, fecha);
    void fetchFn(fecha);
  };

  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation();
    void fetchFn(fecha);
  };

  const fuenteLabel = fuente === "oficial" ? "BCV" : "Paralelo";
  const tasaLabel =
    activa != null
      ? `${activa.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs`
      : loading
        ? "..."
        : error
          ? "Error"
          : "—";

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={ariaLabel}
      className={`group flex items-center gap-2 rounded-full bg-surface/80 backdrop-blur-xl border border-border px-3 py-1.5 text-[11px] font-medium text-foreground active:bg-surface-elevated transition-all touch-manipulation ${className}`}
    >
      <span className="flex items-center gap-1.5">
        {fuenteLabel}
        <span
          role="button"
          tabIndex={-1}
          onClick={handleRefresh}
          className="inline-flex h-3.5 w-3.5 items-center justify-center rounded hover:bg-surface"
          aria-label="Actualizar tasa"
        >
          <RefreshCw className={`h-2.5 w-2.5 ${loading ? "animate-spin" : ""}`} />
        </span>
      </span>
      <span className="font-mono text-[10px] text-muted">{tasaLabel}</span>
    </button>
  );
}

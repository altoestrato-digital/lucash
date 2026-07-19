"use client";

import Link from "next/link";
import { FileText } from "lucide-react";

interface HistorialEmptyStateProps {
  conFiltros: boolean;
  onClearFilters: () => void;
}

export default function HistorialEmptyState({ conFiltros, onClearFilters }: HistorialEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-surface border border-border">
        <FileText className="h-10 w-10 text-muted" />
      </div>
      {conFiltros ? (
        <>
          <p className="mb-1 text-base font-medium text-foreground">Ningún resultado con esos filtros</p>
          <p className="mb-4 text-sm text-muted">Probá ajustando los filtros aplicados</p>
          <button
            onClick={onClearFilters}
            className="rounded-xl bg-surface border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-surface-elevated transition-colors"
          >
            Limpiar filtros
          </button>
        </>
      ) : (
        <>
          <p className="mb-1 text-base font-medium text-foreground">No hay movimientos en este periodo</p>
          <p className="mb-4 text-sm text-muted">Registrá tu primer ingreso o egreso</p>
          <Link
            href="/cargar"
            className="rounded-xl gradient-primary px-5 py-2.5 text-sm font-medium text-white shadow-lg glow-primary hover:scale-105 active:scale-95 transition-all"
          >
            Cargar transacción
          </Link>
        </>
      )}
    </div>
  );
}

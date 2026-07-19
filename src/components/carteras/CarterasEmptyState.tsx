"use client";

import { Plus } from "lucide-react";

interface CarterasEmptyStateProps {
  onCreate: () => void;
}

export default function CarterasEmptyState({ onCreate }: CarterasEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-surface border border-border">
        <Plus className="h-10 w-10 text-muted" />
      </div>
      <p className="mb-1 text-center text-base font-medium text-foreground">
        Creá tu primera cartera para empezar
      </p>
      <p className="mb-6 text-sm text-muted">Efectivo, banco, crypto, inversión...</p>
      <button
        className="rounded-xl gradient-primary px-6 py-2.5 text-sm font-medium text-white shadow-lg glow-primary hover:scale-105 active:scale-95 transition-all"
        onClick={onCreate}
      >
        Crear cartera
      </button>
    </div>
  );
}

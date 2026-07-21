"use client";

import type { ResumenCobertura, Presupuesto, CategoriaDetalle } from "@/types/presupuesto";
import PresupuestoDona from "./PresupuestoDona";
import CoberturaBanner from "./CoberturaBanner";
import CategoriaCard from "./CategoriaCard";
import { Wallet, TrendingUp } from "lucide-react";

interface Props {
  cobertura: ResumenCobertura | null;
  presupuesto: Presupuesto;
  fuenteDisponible: "carteras-cubrir" | "ingreso-esperado";
  onFuenteChange: (fuente: "carteras-cubrir" | "ingreso-esperado") => void;
  detallesMap?: Record<string, CategoriaDetalle[]>;
}

export default function PresupuestoResumen({
  cobertura,
  presupuesto,
  fuenteDisponible,
  onFuenteChange,
  detallesMap,
}: Props) {
  return (
    <div className="space-y-6">
      {cobertura && (
        <div className="flex justify-center">
          <PresupuestoDona cobertura={cobertura} presupuesto={presupuesto} />
        </div>
      )}

      {cobertura && (
        <CoberturaBanner cobertura={cobertura} />
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={() => onFuenteChange("carteras-cubrir")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
            fuenteDisponible === "carteras-cubrir"
              ? "bg-primary text-white shadow-sm"
              : "bg-surface-elevated text-muted hover:text-foreground border border-border"
          }`}
        >
          <Wallet className="w-3.5 h-3.5" />
          Cubrir con carteras
        </button>
        <button
          onClick={() => onFuenteChange("ingreso-esperado")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
            fuenteDisponible === "ingreso-esperado"
              ? "bg-primary text-white shadow-sm"
              : "bg-surface-elevated text-muted hover:text-foreground border border-border"
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          Ingreso esperado
        </button>
      </div>

      {cobertura && cobertura.porCat.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">
            Desglose
          </h2>
          <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
            {cobertura.porCat.map((cat) => (
              <CategoriaCard key={cat.categoriaId} cat={cat} detalles={cat.categoriaId !== "otros" ? detallesMap?.[cat.categoriaId] : undefined} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

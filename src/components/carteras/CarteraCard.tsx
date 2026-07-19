"use client";

import { useState, useRef, useEffect } from "react";
import type { Cartera, MetaCartera, TipoCartera } from "@/types/cartera";
import { MoreVertical } from "lucide-react";
import ColorBorderCard from "@/components/shared/ColorBorderCard";
import MoneyDisplay from "@/components/shared/MoneyDisplay";

interface CarteraCardProps {
  cartera: Cartera;
  meta?: MetaCartera;
  onEdit: () => void;
  onDelete: () => void;
  onTransfer: () => void;
  onClick: () => void;
}

const TIPO_COLORS: Record<TipoCartera, string> = {
  efectivo: "bg-primary/10 text-primary",
  banco: "bg-blue-500/10 text-blue-400",
  prepago: "bg-purple-500/10 text-purple-400",
  crypto: "bg-orange-500/10 text-orange-400",
  inversion: "bg-muted/10 text-muted",
};

export default function CarteraCard({ cartera, meta, onEdit, onDelete, onTransfer, onClick }: CarteraCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const progress = meta && meta.montoObjetivo > 0 ? Math.min(cartera.saldo / meta.montoObjetivo, 1) : 0;

  return (
    <ColorBorderCard color={cartera.color} onClick={onClick} className="group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">{cartera.nombre}</h3>
            {cartera.saldo < 0 && (
              <span className="rounded bg-danger/10 px-1.5 py-0.5 text-[10px] font-bold text-danger">
                NEGATIVO
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className={`rounded px-2 py-0.5 text-[11px] font-medium ${TIPO_COLORS[cartera.tipo]}`}>
              {cartera.tipo}
            </span>
            <span className="rounded bg-surface-elevated px-2 py-0.5 text-[11px] font-medium text-muted">
              {cartera.moneda}
            </span>
            {cartera.objetivo === "ahorro" && (
              <span className="rounded bg-secondary/10 px-2 py-0.5 text-[11px] font-medium text-secondary">
                Ahorro
              </span>
            )}
          </div>
        </div>
        <div className="relative" ref={menuRef}>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-surface-hover hover:text-foreground transition-colors"
            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
            aria-label="Opciones"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 z-10 w-36 rounded-lg glass py-1 shadow-lg animate-scale-in">
              <button
                className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-surface-hover transition-colors"
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEdit(); }}
              >
                Editar
              </button>
              <button
                className={`w-full px-4 py-2 text-left text-sm transition-colors ${cartera.saldo <= 0 ? "text-muted cursor-not-allowed" : "text-foreground hover:bg-surface-hover"}`}
                disabled={cartera.saldo <= 0}
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onTransfer(); }}
              >
                Transferir
              </button>
              <button
                className="w-full px-4 py-2 text-left text-sm text-danger hover:bg-surface-hover transition-colors"
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(); }}
              >
                Eliminar
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3">
        <MoneyDisplay
          monto={cartera.saldo}
          monedaOrigen={cartera.moneda}
          primaryClassName="text-xl font-bold text-foreground animate-count-up"
          secondaryClassName="text-sm text-muted"
        />
      </div>

      {meta && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>{meta.nombre}</span>
            <span>{Math.round(progress * 100)}%</span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-elevated">
            <div
              className="h-full rounded-full gradient-primary transition-all duration-700 ease-out"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      )}
    </ColorBorderCard>
  );
}

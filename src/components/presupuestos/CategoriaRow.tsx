"use client";

import { useState, useRef, useEffect } from "react";
import type { Categoria } from "@/types/presupuesto";
import { useMonedaActiva } from "@/hooks/useMonedaActiva";

export default function CategoriaRow({
  cat,
  onEdit,
  onDelete,
  onDetalles,
}: {
  cat: Categoria;
  onEdit: () => void;
  onDelete: () => void;
  onDetalles: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { fromBs, fromCartera } = useMonedaActiva();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const prioridadLabels: Record<number, string> = { 1: "P1", 2: "P2", 3: "P3" };
  const prioridadColors: Record<number, string> = {
    1: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    2: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    3: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  };

  const displayPair = cat.limiteMoneda === "Bs"
    ? fromBs(cat.limite)
    : fromCartera(Number(cat.limite), cat.limiteMoneda);

  return (
    <div className="flex items-center gap-3 py-3 px-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700">
      <span
        className="w-3 h-3 rounded-full shrink-0"
        style={{ backgroundColor: cat.color }}
      />
      <span className="flex-1 text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
        {cat.nombre}
      </span>
      <div className="flex items-center gap-1.5">
        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${prioridadColors[cat.prioridad]}`}>
          {prioridadLabels[cat.prioridad]}
        </span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
          {displayPair.primary}
        </span>
        {cat.recurrente && (
          <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-1.5 py-0.5 rounded font-medium">
            R
          </span>
        )}
      </div>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
          aria-label="Opciones"
        >
          <svg className="w-5 h-5 text-zinc-500" fill="currentColor" viewBox="0 0 20 20">
            <circle cx="10" cy="4" r="1.5" />
            <circle cx="10" cy="10" r="1.5" />
            <circle cx="10" cy="16" r="1.5" />
          </svg>
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 z-10 py-1">
            <button
              onClick={() => { onEdit(); setMenuOpen(false); }}
              className="w-full text-left px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
            >
              Editar
            </button>
            <button
              onClick={() => { onDetalles(); setMenuOpen(false); }}
              className="w-full text-left px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
            >
              Detalles
            </button>
            <button
              onClick={() => { onDelete(); setMenuOpen(false); }}
              className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-700"
            >
              Eliminar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

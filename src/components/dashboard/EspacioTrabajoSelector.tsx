"use client";

import { useState, useRef, useEffect } from "react";
import type { EspacioTrabajo } from "@/types/espacio-trabajo";
import { ChevronDown, Plus, Pencil, Check } from "lucide-react";

interface EspacioTrabajoSelectorProps {
  espacios: EspacioTrabajo[];
  activoId: string;
  onSelect: (id: string) => void;
  onCrear: () => void;
  onEditar: (espacio: EspacioTrabajo) => void;
}

export default function EspacioTrabajoSelector({
  espacios,
  activoId,
  onSelect,
  onCrear,
  onEditar,
}: EspacioTrabajoSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const activo = espacios.find((e) => e.id === activoId);
  const label = activo?.nombre ?? "Personal";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg bg-white/15 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/25 transition-colors"
      >
        <span className="truncate max-w-[140px]">{label}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-56 rounded-xl bg-white dark:bg-zinc-800 shadow-lg border border-zinc-200 dark:border-zinc-700 z-50 py-1">
          {espacios.map((e) => (
            <div key={e.id} className="flex items-center group">
              <button
                className={`flex-1 flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${e.id === activoId ? "bg-zinc-100 dark:bg-zinc-700 font-medium text-zinc-900 dark:text-zinc-100" : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50"}`}
                onClick={() => { onSelect(e.id); setOpen(false); }}
              >
                {e.id === activoId && <Check className="h-4 w-4 text-emerald-500" />}
                <span className={e.id === activoId ? "" : "ml-6"}>{e.nombre}</span>
              </button>
              <button
                className="mr-2 p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(ev) => { ev.stopPropagation(); onEditar(e); setOpen(false); }}
                aria-label="Editar"
              >
                <Pencil className="h-3.5 w-3.5 text-zinc-500" />
              </button>
            </div>
          ))}

          <div className="border-t border-zinc-200 dark:border-zinc-700 mt-1 pt-1">
            <button
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-primary hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors"
              onClick={() => { onCrear(); setOpen(false); }}
            >
              <Plus className="h-4 w-4" />
              Nuevo espacio
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import type { Prioridad } from "@/types/presupuesto";

const opciones: { value: Prioridad; label: string }[] = [
  { value: 1, label: "Alta" },
  { value: 2, label: "Media" },
  { value: 3, label: "Baja" },
];

export default function PrioridadControl({
  value,
  onChange,
}: {
  value: Prioridad;
  onChange: (p: Prioridad) => void;
}) {
  return (
    <div className="flex rounded-lg border border-zinc-300 dark:border-zinc-600 overflow-hidden" role="radiogroup" aria-label="Prioridad">
      {opciones.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
            value === o.value
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "bg-white text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

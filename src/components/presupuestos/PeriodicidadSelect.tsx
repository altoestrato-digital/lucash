"use client";

import type { Periodicidad } from "@/types/presupuesto";

const opciones: { value: Periodicidad; label: string }[] = [
  { value: "diaria", label: "Diaria" },
  { value: "semanal", label: "Semanal" },
  { value: "quincenal", label: "Quincenal" },
  { value: "mensual", label: "Mensual" },
  { value: "trimestral", label: "Trimestral" },
];

export default function PeriodicidadSelect({
  value,
  quincenaCorteDia,
  onChange,
  onChangeCorte,
}: {
  value: Periodicidad;
  quincenaCorteDia?: 1 | 16;
  onChange: (p: Periodicidad) => void;
  onChangeCorte: (d: 1 | 16) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex rounded-lg border border-zinc-300 dark:border-zinc-600 overflow-hidden" role="radiogroup" aria-label="Periodicidad">
        {opciones.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            onClick={() => onChange(o.value)}
            className={`flex-1 px-2 py-2 text-xs font-medium transition-colors ${
              value === o.value
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "bg-white text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      {value === "quincenal" && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">Corte:</span>
          <div className="flex rounded-lg border border-zinc-300 dark:border-zinc-600 overflow-hidden">
            {([1, 16] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => onChangeCorte(d)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  quincenaCorteDia === d
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "bg-white text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                }`}
              >
                Día {d}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

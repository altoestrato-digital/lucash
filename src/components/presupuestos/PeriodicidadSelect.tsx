"use client";

import type { Periodicidad } from "@/types/presupuesto";
import type { ISODate } from "@/lib/dates";

const opciones: { value: Periodicidad; label: string }[] = [
  { value: "semanal", label: "Semanal" },
  { value: "quincenal", label: "Quincenal" },
  { value: "mensual", label: "Mensual" },
  { value: "trimestral", label: "Trimestral" },
  { value: "rango", label: "Rango" },
];

export default function PeriodicidadSelect({
  value,
  quincenaCorteDia,
  fechaInicio,
  fechaFin,
  onChange,
  onChangeCorte,
  onChangeFechaInicio,
  onChangeFechaFin,
}: {
  value: Periodicidad;
  quincenaCorteDia?: 1 | 16;
  fechaInicio?: ISODate;
  fechaFin?: ISODate;
  onChange: (p: Periodicidad) => void;
  onChangeCorte: (d: 1 | 16) => void;
  onChangeFechaInicio: (f: ISODate) => void;
  onChangeFechaFin: (f: ISODate) => void;
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
      {value === "rango" && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Inicio</label>
            <input
              type="date"
              value={fechaInicio ?? ""}
              onChange={(e) => onChangeFechaInicio(e.target.value as ISODate)}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Fin</label>
            <input
              type="date"
              value={fechaFin ?? ""}
              min={fechaInicio ?? undefined}
              onChange={(e) => onChangeFechaFin(e.target.value as ISODate)}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
          </div>
        </div>
      )}
    </div>
  );
}

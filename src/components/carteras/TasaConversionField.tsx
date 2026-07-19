"use client";

interface TasaConversionFieldProps {
  value: string;
  onChange: (v: string) => void;
  moneda: string;
  suggested: number;
  fecha: string;
}

export default function TasaConversionField({ value, onChange, moneda, suggested, fecha }: TasaConversionFieldProps) {
  const showWarning = !value && suggested === 0;

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Tasa de conversión
      </label>
      <div className="relative">
        <input
          className={`w-full rounded-lg border px-3 py-2 text-sm text-zinc-900 outline-none dark:bg-zinc-800 dark:text-zinc-50 dark:focus:border-zinc-400 ${
            showWarning
              ? "border-amber-400 focus:border-amber-500"
              : "border-zinc-300 focus:border-zinc-500 dark:border-zinc-600"
          }`}
          type="number"
          step="any"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={suggested > 0 ? String(suggested) : "Sin tasa disponible"}
        />
      </div>
      {suggested > 0 && !value && (
        <p className="mt-1 text-xs text-zinc-400">
          Sugerido: {suggested}
          <button
            className="ml-1 text-zinc-600 underline hover:text-zinc-800 dark:text-zinc-300 dark:hover:text-zinc-100"
            onClick={() => onChange(String(suggested))}
          >
            Usar esta
          </button>
        </p>
      )}
      {showWarning && (
        <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
          No se encontró tasa para {moneda} en {fecha.slice(0, 10)}. Ingresala manualmente.
        </p>
      )}
    </div>
  );
}

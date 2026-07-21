"use client";

import { useMemo } from "react";
import type { MonedaBudget } from "@/types/presupuesto";
import { toIso } from "@/lib/dates";
import { toBs } from "@/lib/conversion";

export type MoneyInputSize = "sm" | "md";

export default function MoneyInput({
  value,
  onChange,
  moneda,
  onMonedaChange,
  size = "md",
  placeholder = "0.00",
  label,
  className = "",
  inputClassName = "",
  selectClassName = "",
  showEquivalent = true,
  autoFocus,
  prioritizeMoneda,
}: {
  value: string;
  onChange: (next: string) => void;
  moneda: MonedaBudget;
  onMonedaChange: (next: MonedaBudget) => void;
  size?: MoneyInputSize;
  placeholder?: string;
  label?: string;
  className?: string;
  inputClassName?: string;
  selectClassName?: string;
  showEquivalent?: boolean;
  autoFocus?: boolean;
  prioritizeMoneda?: MonedaBudget;
}) {
  const hoy = useMemo(() => toIso(new Date()), []);
  const num = Number(value);
  const hasValue = value !== "" && !isNaN(num) && num > 0;

  const equivalentBs = hasValue ? toBs(num, "USD", hoy) : 0;
  const equivalentUsd = hasValue ? (moneda === "Bs" ? toBs(num, "USD", hoy) / Number(toBs(1, "USD", hoy)) : num) : 0;

  const padding = size === "sm" ? "px-3 py-1.5" : "px-3 py-2.5";
  const baseInput = `w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 ${padding} text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400`;

  const monedas: MonedaBudget[] = prioritizeMoneda === "USD" ? ["USD", "Bs"] : ["Bs", "USD"];

  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{label}</label>}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            min={0}
            step="0.01"
            placeholder={placeholder}
            autoFocus={autoFocus}
            className={`${baseInput} ${inputClassName}`}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400 pointer-events-none">
            {moneda === "USD" ? "USD" : "Bs"}
          </span>
        </div>
        <select
          value={moneda}
          onChange={(e) => onMonedaChange(e.target.value as MonedaBudget)}
          className={`rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 ${padding} text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400 ${selectClassName}`}
        >
          {monedas.map((m) => (
            <option key={m} value={m}>{m === "USD" ? "USD" : "Bs"}</option>
          ))}
        </select>
      </div>
      {showEquivalent && hasValue && (
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {moneda === "Bs"
            ? `≈ USD ${equivalentUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : `≈ Bs ${equivalentBs.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        </p>
      )}
    </div>
  );
}

"use client";

export type MonedaToggle = "Bs" | "USD";

interface MonedaPillToggleProps {
  moneda: MonedaToggle;
  onToggle: () => void;
  className?: string;
  ariaLabel?: string;
}

export default function MonedaPillToggle({
  moneda,
  onToggle,
  className = "",
  ariaLabel = "Cambiar moneda",
}: MonedaPillToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={ariaLabel}
      className={`rounded-xl bg-white/15 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-white hover:bg-white/25 transition-colors ${className}`}
    >
      {moneda}
    </button>
  );
}

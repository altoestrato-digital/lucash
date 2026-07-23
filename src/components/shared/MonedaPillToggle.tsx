"use client";

import { ArrowLeftRight } from "lucide-react";

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
      className={`flex items-center gap-1.5 rounded-full bg-surface/80 backdrop-blur-xl border border-border px-3 py-1.5 text-xs font-medium text-foreground active:bg-surface-elevated transition-all touch-manipulation ${className}`}
    >
      <ArrowLeftRight className="h-3 w-3" />
      {moneda}
    </button>
  );
}

"use client";

import { usePerfil } from "@/hooks/usePerfil";
import { useTasaActiva } from "@/hooks/useTasaActiva";
import { toIso } from "@/lib/dates";
import { convertirAMoneyValues } from "@/lib/conversion";
import { formatPair, type MoneyPair } from "@/lib/money";
import type { Moneda } from "@/types/cartera";

interface MoneyDisplayProps {
  monto: number;
  monedaOrigen: Moneda;
  className?: string;
  primaryClassName?: string;
  secondaryClassName?: string;
}

/**
 * Renderiza un par formateado (moneda preferida + la opuesta) para un
 * monto en su moneda nativa, usando la tasa activa (oficial o paralelo)
 * y la moneda preferida del perfil.
 */
export default function MoneyDisplay({
  monto,
  monedaOrigen,
  className,
  primaryClassName = "text-xl font-bold text-foreground",
  secondaryClassName = "text-sm text-muted",
}: MoneyDisplayProps) {
  const { perfil } = usePerfil();
  useTasaActiva(); // suscripción para re-render cuando cambia la tasa activa

  const hoy = toIso(new Date());
  const monedaPreferida = perfil.preferencias.moneda;
  const { bs: bsValue, usd: usdValue } = convertirAMoneyValues(monto, monedaOrigen, hoy);

  const pair: MoneyPair = formatPair(bsValue, usdValue, monedaPreferida);

  return (
    <div className={className}>
      <p className={primaryClassName}>{pair.primary}</p>
      <p className={secondaryClassName}>{pair.secondary}</p>
    </div>
  );
}

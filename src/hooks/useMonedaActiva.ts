"use client";

import { usePerfil } from "@/hooks/usePerfil";
import { useTasaActiva } from "@/hooks/useTasaActiva";
import { toIso } from "@/lib/dates";
import { convertirAMoneyValues } from "@/lib/conversion";
import { formatPair, type Money, type MoneyPair } from "@/lib/money";
import type { MonedaPreferida } from "@/types/perfil";
import type { Moneda } from "@/types/cartera";
import type { ISODate } from "@/lib/dates";

export interface UseMonedaActivaReturn {
  moneda: MonedaPreferida;
  fromBs: (value: Money) => MoneyPair;
  fromCartera: (saldo: number, monedaOrigen: Moneda) => MoneyPair;
  formatPair: (bs: Money, usd: Money) => MoneyPair;
  hoy: ISODate;
}

export function useMonedaActiva(): UseMonedaActivaReturn {
  const { perfil } = usePerfil();
  useTasaActiva(); // suscripción para re-render cuando cambia la tasa activa

  const moneda: MonedaPreferida = perfil.preferencias.moneda;
  const hoy = toIso(new Date());

  const fromBs = (value: Money): MoneyPair => {
    const { bs, usd } = convertirAMoneyValues(Number(value), "Bs", hoy);
    return formatPair(bs, usd, moneda);
  };

  const fromCartera = (saldo: number, monedaOrigen: Moneda): MoneyPair => {
    const { bs, usd } = convertirAMoneyValues(saldo, monedaOrigen, hoy);
    return formatPair(bs, usd, moneda);
  };

  const formatPairCurried = (bsValue: Money, usdValue: Money): MoneyPair =>
    formatPair(bsValue, usdValue, moneda);

  return { moneda, fromBs, fromCartera, formatPair: formatPairCurried, hoy };
}

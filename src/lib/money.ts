import type { MonedaPreferida } from "@/types/perfil";

declare const __moneyBrand: unique symbol;
export type Money = number & { readonly [__moneyBrand]: "Bs" | "USD" };

export const bs = (n: number): Money => n as Money;
export const usd = (n: number): Money => n as Money;

export const formatBs = (m: Money): string => {
  const abs = Math.abs(m);
  const formatted = abs.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `Bs ${m < 0 ? "-" : ""}${formatted}`;
};

export const formatUsd = (m: Money): string => {
  const abs = Math.abs(m);
  const formatted = abs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `USD ${m < 0 ? "-" : ""}${formatted}`;
};

export const sum = (a: Money, b: Money): Money => (a + b) as Money;
export const sub = (a: Money, b: Money): Money => (a - b) as Money;
export const convert = (m: Money, tasa: Money): Money => (m / tasa) as Money;

export interface MoneyPair {
  primary: string;
  secondary: string;
}

export const formatPair = (
  bsValue: Money,
  usdValue: Money,
  moneda: MonedaPreferida,
): MoneyPair => {
  if (moneda === "Bs") {
    return { primary: formatBs(bsValue), secondary: formatUsd(usdValue) };
  }
  return { primary: formatUsd(usdValue), secondary: formatBs(bsValue) };
};

export const formatPairInline = (
  bsValue: Money,
  usdValue: Money,
  moneda: MonedaPreferida,
): string => {
  const { primary, secondary } = formatPair(bsValue, usdValue, moneda);
  return `${primary} · ${secondary}`;
};

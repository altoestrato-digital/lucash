import type { Moneda } from "@/types/cartera";
import type { ISODate } from "@/lib/dates";
import { tasasBcvRepo, tasasCriptoRepo } from "@/lib/db";
import { useDolarApiStore } from "@/stores/dolar-api";
import { bs, usd, type Money } from "@/lib/money";

/**
 * Devuelve la tasa activa (la que el usuario eligió: oficial o paralelo)
 * para la fecha indicada. Orden de prioridad:
 *   1) Cache vivo del store de zustand (resultado del último fetch).
 *   2) Fallback a SQLite (`tasa_bcv`), donde `syncActiveToBcv` deja
 *      siempre un valor sincronizado con la preferencia del perfil.
 *
 * Devuelve `null` si nunca se buscó tasa para esa fecha.
 */
export const lookupBcv = (fecha: ISODate): Money | null => {
  const snapshot = useDolarApiStore.getState().getTasaActivaSync();
  if (snapshot && snapshot.fecha === fecha && snapshot.activa != null) {
    return bs(snapshot.activa);
  }
  const entry = tasasBcvRepo.get(fecha);
  return entry ? entry.tasa : null;
};

export const lookupCripto = (
  moneda: "USDT" | "BTC" | "ETH",
  fecha: ISODate,
): { precioUsd: number } | null => {
  const entry = tasasCriptoRepo.get(moneda, fecha);
  return entry ? { precioUsd: entry.precioUsd } : null;
};

export const getTasaCriptoHoy = (moneda: "USDT" | "BTC" | "ETH"): number => {
  return tasasCriptoRepo.getHoy(moneda)?.precioUsd ?? 0;
};

/**
 * Helpers de bajo nivel: explicitan la matemática para que sea fácil de
 * auditar (mismo cálculo que `convertirAUSD` / `convertirABs` pero
 * tomando la tasa como parámetro, sin lookup).
 *
 * - `bsToUsd(b, tasa)`  →  b / tasa   (monto en Bs → USD)
 * - `usdToBs(u, tasa)`  →  u * tasa   (monto en USD → Bs)
 */
export const bsToUsd = (montoBs: number, tasa: number): number =>
  tasa > 0 ? montoBs / tasa : 0;

export const usdToBs = (montoUsd: number, tasa: number): number =>
  montoUsd * tasa;

/**
 * Convierte un monto en su moneda nativa a su equivalente en USD,
 * usando la tasa activa (oficial o paralelo) del día.
 *
 *   - USD / USDT  →  identidad (ya está en USD)
 *   - Bs          →  monto / tasa
 *   - BTC / ETH   →  monto * precioUsdCripto
 *
 * Para llegar a Bs se encadena con `convertirABs(usd, fecha)`.
 */
export const convertirAUSD = (monto: number, moneda: Moneda, fecha: ISODate): Money => {
  if (moneda === "USD" || moneda === "USDT") return usd(monto);
  if (moneda === "Bs") {
    const tasa = Number(lookupBcv(fecha) ?? 0);
    return usd(bsToUsd(monto, tasa));
  }
  const cripto = lookupCripto(moneda, fecha) ?? { precioUsd: getTasaCriptoHoy(moneda) };
  return usd(monto * cripto.precioUsd);
};

/**
 * Convierte un valor en USD a su equivalente en Bs multiplicando por
 * la tasa activa del día (oficial o paralelo).
 */
export const convertirABs = (usdValue: Money, fecha: ISODate): Money => {
  const tasa = Number(lookupBcv(fecha) ?? 0);
  return bs(usdToBs(Number(usdValue), tasa));
};

/**
 * Convierte un monto en su moneda nativa a su par { bs, usd }.
 * Centraliza la misma lógica que `convertirAUSD` + `convertirABs`.
 */
export const convertirAMoneyValues = (monto: number, moneda: Moneda, fecha: ISODate): { bs: Money; usd: Money } => {
  const usdEq = convertirAUSD(monto, moneda, fecha);
  const bsEq = convertirABs(usdEq, fecha);
  return { bs: bsEq, usd: usdEq };
};

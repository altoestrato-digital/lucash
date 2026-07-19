"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  tasasDolarApiRepo,
  tasasBcvRepo,
  perfilRepo,
  type TasaDolarapiEntry,
} from "@/lib/db";
import { toIso } from "@/lib/dates";
import type { ISODate } from "@/lib/dates";
import type { FuenteTasaPreferida } from "@/types/perfil";

const DOLARAPI_BASE = "https://ve.dolarapi.com/v1/historicos/dolares";

/**
 * Dónde se persiste el valor del dólar (auditoría rápida):
 *
 *  1. **Zustand store (en memoria)** — `tasaOficial`, `tasaParalelo`,
 *     `fechaTasa`, `lastFetch`. Es la cache viva que `lookupBcv` y
 *     `useDolarApiForDate` consultan para lecturas síncronas.
 *     Vive en la sesión del tab; se pierde al recargar.
 *
 *  2. **SQLite vía `tasasDolarApiRepo`** — tabla `tasa_dolarapi`,
 *     clave primaria compuesta `(fecha, fuente)`. Guarda el valor crudo
 *     que devuelve dolarapi.com, tanto para `"oficial"` como para
 *     `"paralelo"`. Persiste a IndexedDB (DB `lucash-sqlite`, store
 *     `files`, key `db`) y sobrevive recargas.
 *
 *  3. **SQLite vía `tasasBcvRepo`** — tabla `tasa_bcv`, clave primaria
 *     `fecha`. Es el espejo de la tasa activa (la que el usuario
 *     eligió). `lookupBcv` cae a esta tabla como fallback. Persiste
 *     a IndexedDB igual que la anterior.
 *
 *  4. **Perfil (`perfilRepo`)** — tabla `perfil`, columna `preferencias`
 *     (JSON). Guarda la **preferencia** del usuario (`fuenteTasa:
 *     "oficial" | "paralelo"`), no el valor. Es la fuente de verdad
 *     para decidir cuál de las dos tasas es la activa.
 *
 *  Flujo al togglear:
 *    DolarToggle.handleToggle
 *      → setFuenteActiva(next)        // escribe preferencia en `perfil`
 *      → syncActiveToBcv(fecha)       // copia valor de `tasa_dolarapi`
 *                                    //   a `tasa_bcv` (si hay cache)
 *      → fetchFn(fecha)               // GET a dolarapi.com
 *          → tasasDolarApiRepo.set    // escribe valor crudo
 *          → set({ tasaOficial, ... }) // actualiza cache de zustand
 *          → syncActiveToBcv(fecha)   // re-sincroniza `tasa_bcv`
 *                                    //   con el valor fresco
 */

export interface DolarApiError {
  message: string;
  fecha?: ISODate;
  fuente?: "oficial" | "paralelo";
}

export interface TasaActivaSnapshot {
  oficial: number | null;
  paralelo: number | null;
  activa: number | null;
  fecha: ISODate;
  fuente: "oficial" | "paralelo";
}

interface DolarApiState {
  loading: boolean;
  error: DolarApiError | null;
  lastFetch: { fecha: ISODate; fuente: "oficial" | "paralelo" } | null;

  tasaOficial: number | null;
  tasaParalelo: number | null;
  fechaTasa: ISODate | null;

  fetch: (fecha?: ISODate) => Promise<{ oficial: number | null; paralelo: number | null }>;
  setFuenteActiva: (fuente: FuenteTasaPreferida, fecha?: ISODate) => boolean;
  syncActiveToBcv: (fecha: ISODate) => boolean;
  getTasaActivaSync: () => TasaActivaSnapshot | null;
}

interface DolarApiResponseItem {
  fecha?: string;
  fuente?: string;
  compra?: number;
  venta?: number;
  promedio?: number;
}

function fechaToUrl(fecha: ISODate): string {
  return fecha.replaceAll("-", "/");
}

/**
 * dolarapi.com devuelve por cada fuente algo como:
 *   { fuente: "oficial", compra: 24.5, venta: 24.7, promedio: 24.6, fecha: "2026-07-17" }
 *
 * Usamos `promedio` como valor principal (convención de la mayoría de
 * las apps financieras venezolanas). Si la API no lo trae, caemos a
 * `venta` y luego a `compra`.
 */
function pickRate(item: DolarApiResponseItem): number | null {
  if (typeof item.promedio === "number" && Number.isFinite(item.promedio) && item.promedio > 0) {
    return item.promedio;
  }
  if (typeof item.venta === "number" && Number.isFinite(item.venta) && item.venta > 0) {
    return item.venta;
  }
  if (typeof item.compra === "number" && Number.isFinite(item.compra) && item.compra > 0) {
    return item.compra;
  }
  return null;
}

async function fetchFuente(
  fuente: "oficial" | "paralelo",
  fecha: ISODate,
): Promise<number | null> {
  const url = `${DOLARAPI_BASE}/${fuente}/${fechaToUrl(fecha)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return null;
  const data = (await res.json()) as DolarApiResponseItem | DolarApiResponseItem[];
  const list = Array.isArray(data) ? data : [data];
  for (const item of list) {
    const rate = pickRate(item);
    if (rate != null) return rate;
  }
  return null;
}

function writeLocalStorageDiag(snapshot: {
  fecha: ISODate;
  oficial: number | null;
  paralelo: number | null;
  fuente: "oficial" | "paralelo";
  fetchedAt: string;
}) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      "lucash:dolar:lastFetch",
      JSON.stringify(snapshot),
    );
  } catch {
    // localStorage puede estar bloqueado (modo privado, cuota llena, etc.)
    // La persistencia real sigue siendo la DB.
  }
}

export const useDolarApiStore = create<DolarApiState>()(
  devtools(
    (set, get) => ({
      loading: false,
      error: null,
      lastFetch: null,
      tasaOficial: null,
      tasaParalelo: null,
      fechaTasa: null,

      fetch: async (fechaArg) => {
        const fecha = fechaArg ?? toIso(new Date());
        set({ loading: true, error: null });
        try {
          const [oficial, paralelo] = await Promise.all([
            fetchFuente("oficial", fecha),
            fetchFuente("paralelo", fecha),
          ]);

          if (oficial != null) tasasDolarApiRepo.set(fecha, "oficial", oficial);
          if (paralelo != null) tasasDolarApiRepo.set(fecha, "paralelo", paralelo);

          set({
            lastFetch: { fecha, fuente: "oficial" },
            tasaOficial: oficial,
            tasaParalelo: paralelo,
            fechaTasa: fecha,
          });

          get().syncActiveToBcv(fecha);

          const fuenteTasa = perfilRepo.get()?.preferencias.fuenteTasa ?? "oficial";
          writeLocalStorageDiag({
            fecha,
            oficial,
            paralelo,
            fuente: fuenteTasa,
            fetchedAt: new Date().toISOString(),
          });

          return { oficial, paralelo };
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e);
          set({ error: { message, fecha } });
          return { oficial: null, paralelo: null };
        } finally {
          set({ loading: false });
        }
      },

      setFuenteActiva: (fuente, fechaArg) => {
        const fecha = fechaArg ?? toIso(new Date());
        const perfil = perfilRepo.get();
        if (!perfil) return false;
        perfilRepo.upsert({
          preferencias: { ...perfil.preferencias, fuenteTasa: fuente },
        });
        return get().syncActiveToBcv(fecha);
      },

      syncActiveToBcv: (fecha) => {
        const perfil = perfilRepo.get();
        if (!perfil) return false;
        const fuenteActiva = perfil.preferencias.fuenteTasa;
        const entry: TasaDolarapiEntry | null = tasasDolarApiRepo.get(fecha, fuenteActiva);
        if (!entry) return false;
        const existente = tasasBcvRepo.get(fecha);
        if (existente && existente.fuente === "manual") return false;
        tasasBcvRepo.set(fecha, entry.valor, fuenteActiva);
        return true;
      },

      getTasaActivaSync: () => {
        const { tasaOficial, tasaParalelo, fechaTasa } = get();
        if (!fechaTasa) return null;
        const perfil = perfilRepo.get();
        const fuenteTasa = perfil?.preferencias.fuenteTasa ?? "oficial";
        const activa = fuenteTasa === "oficial" ? tasaOficial : tasaParalelo;
        return {
          oficial: tasaOficial,
          paralelo: tasaParalelo,
          activa,
          fecha: fechaTasa,
          fuente: fuenteTasa,
        };
      },
    }),
    { name: "lucash/dolar-api" },
  ),
);

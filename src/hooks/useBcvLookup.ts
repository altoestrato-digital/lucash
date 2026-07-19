"use client";

import { useCallback, useRef, useSyncExternalStore } from "react";
import type { ISODate } from "@/lib/dates";
import { tasasBcvRepo, subscribe, type FuenteTasa } from "@/lib/db";
import { bs } from "@/lib/money";

export interface TasaVigente {
  valor: ReturnType<typeof bs>;
  fuente: FuenteTasa;
  fecha: ISODate;
}

type BcvEntry = ReturnType<typeof tasasBcvRepo.getVigente>;

/**
 * Cache de snapshot. `useSyncExternalStore` exige referencia estable.
 *
 * La invalidación se hace DENTRO del `subscribe` (no en `useEffect`)
 * para que el siguiente `getSnapshot` — llamado por React en el mismo
 * ciclo de render — devuelva el valor nuevo. Si se hiciera en
 * `useEffect`, React pintaría con el valor viejo.
 */
export function useBcvLookup(fecha: ISODate): TasaVigente {
  const cacheRef = useRef<{ fecha: ISODate; entry: BcvEntry } | null>(null);

  const getEntry = useCallback((): BcvEntry => {
    const cached = cacheRef.current;
    if (cached && cached.fecha === fecha) return cached.entry;
    const entry = tasasBcvRepo.getVigente(fecha);
    cacheRef.current = { fecha, entry };
    return entry;
  }, [fecha]);

  const subscribeInvalidating = useCallback((callback: () => void) => {
    return subscribe(() => {
      cacheRef.current = null;
      callback();
    });
  }, []);

  const entry = useSyncExternalStore(subscribeInvalidating, getEntry, () => null);

  if (entry) {
    return { valor: entry.tasa, fuente: entry.fuente, fecha: entry.fecha };
  }
  return { valor: bs(0), fuente: "manual", fecha };
}

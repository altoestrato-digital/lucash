"use client";

import { useCallback, useRef, useSyncExternalStore } from "react";
import { tasasDolarApiRepo, subscribe } from "@/lib/db";
import { usePerfil } from "@/hooks/usePerfil";
import { useDolarApiStore } from "@/stores/dolar-api";
import { toIso } from "@/lib/dates";
import type { ISODate } from "@/lib/dates";
import type { FuenteTasaPreferida } from "@/types/perfil";

export interface DolarApiForDate {
  fecha: ISODate;
  fuenteActiva: FuenteTasaPreferida;
  oficial: number | null;
  paralelo: number | null;
  activa: number | null;
  fetchedAt: string | null;
}

type DolarApiEntry = ReturnType<typeof tasasDolarApiRepo.get>;

interface DolarApiSnapshot {
  oficial: DolarApiEntry;
  paralelo: DolarApiEntry;
}

/**
 * `useSyncExternalStore` exige que `getSnapshot` devuelva la MISMA
 * referencia cuando los datos no cambiaron; si no, React entra en loop
 * infinito. Las funciones `get()` de los repos crean un objeto nuevo
 * en cada llamada, así que cacheamos el último resultado.
 *
 * La invalidación del cache ocurre DENTRO del callback de `subscribe`
 * (no en un `useEffect`) para que el próximo `getSnapshot` — que React
 * llama en el mismo ciclo de render — ya devuelva el valor nuevo. Si
 * se invalidara en `useEffect`, React renderizaría con el valor viejo
 * y la card mostraría la tasa anterior hasta el próximo render.
 */
export function useDolarApiForDate(fecha: ISODate = toIso(new Date())): DolarApiForDate {
  const { perfil } = usePerfil();
  const fuenteActiva = perfil.preferencias.fuenteTasa;
  const cacheRef = useRef<{ fecha: ISODate; snap: DolarApiSnapshot } | null>(null);

  const getSnap = useCallback((): DolarApiSnapshot => {
    const cached = cacheRef.current;
    if (cached && cached.fecha === fecha) return cached.snap;
    const snap = loadSnapshot(fecha);
    cacheRef.current = { fecha, snap };
    return snap;
  }, [fecha]);

  const subscribeInvalidating = useCallback((callback: () => void) => {
    return subscribe(() => {
      cacheRef.current = null;
      callback();
    });
  }, []);

  const oficialEntry = useSyncExternalStore(
    subscribeInvalidating,
    () => getSnap().oficial,
    () => null,
  );
  const paraleloEntry = useSyncExternalStore(
    subscribeInvalidating,
    () => getSnap().paralelo,
    () => null,
  );

  const activaEntry = fuenteActiva === "oficial" ? oficialEntry : paraleloEntry;

  return {
    fecha,
    fuenteActiva,
    oficial: oficialEntry?.valor ?? null,
    paralelo: paraleloEntry?.valor ?? null,
    activa: activaEntry?.valor ?? null,
    fetchedAt: activaEntry?.fetchedAt ?? null,
  };
}

function loadSnapshot(fecha: ISODate): DolarApiSnapshot {
  return {
    oficial: tasasDolarApiRepo.get(fecha, "oficial"),
    paralelo: tasasDolarApiRepo.get(fecha, "paralelo"),
  };
}

/**
 * Versión "live" de la preferencia de fuente + acciones para cambiarla.
 * Cambiar la fuente actualiza el perfil y sincroniza `tasa_bcv` para que
 * todas las conversiones (cards, KPIs, charts) reflejen la nueva tasa
 * sin necesidad de un re-fetch.
 */
export function useFuenteTasa() {
  const { perfil } = usePerfil();
  const setFuenteActiva = useDolarApiStore((s) => s.setFuenteActiva);
  const loading = useDolarApiStore((s) => s.loading);
  const fuente = perfil.preferencias.fuenteTasa;
  return { fuente, setFuente: setFuenteActiva, loading };
}

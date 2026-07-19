"use client";

import { useEffect, useRef } from "react";
import { useDolarApiStore } from "@/stores/dolar-api";
import { toIso } from "@/lib/dates";

/**
 * Dispara un fetch en background de la tasa del día apenas la app monta.
 * No bloquea el render ni muestra UI: si la red falla o no hay datos
 * previos, el resto de la app sigue funcionando con la entrada manual.
 */
export function DolarApiBootstrap() {
  const fetchFn = useDolarApiStore((s) => s.fetch);
  const lastFetch = useDolarApiStore((s) => s.lastFetch);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    void fetchFn(toIso(new Date()));
  }, [fetchFn]);

  // Re-fetch si la fecha del último fetch ya no es hoy (caso pestaña
  // abierta varios días). No es crítico, pero mantiene la tasa fresca.
  useEffect(() => {
    if (!lastFetch) return;
    const today = toIso(new Date());
    if (lastFetch.fecha !== today) {
      void fetchFn(today);
    }
  }, [fetchFn, lastFetch]);

  return null;
}

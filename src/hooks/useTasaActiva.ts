"use client";

import { usePerfil } from "@/hooks/usePerfil";
import { useDolarApiStore } from "@/stores/dolar-api";

/**
 * Hook de suscripción a la tasa activa (oficial o paralelo) según la
 * preferencia del perfil. Devuelve el valor actual y fuerza re-render
 * cuando cambia. El valor se usa normalmente a través de `lookupBcv`
 * en `lib/conversion.ts`; este hook solo garantiza que los componentes
 * se actualicen cuando la tasa cambia.
 */
export function useTasaActiva(): number | null {
  const { perfil } = usePerfil();
  const fuente = perfil.preferencias.fuenteTasa;
  return useDolarApiStore((s) => (fuente === "oficial" ? s.tasaOficial : s.tasaParalelo));
}

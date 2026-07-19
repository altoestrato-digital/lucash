"use client";

import { useCallback, useState } from "react";
import type { Adjunto, Transaccion } from "@/types/transaccion";

export function useUploadOcr() {
  const [analizando, setAnalizando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analizar = useCallback(
    async (_adjunto: Adjunto): Promise<Partial<Transaccion> | null> => {
      void _adjunto;
      setAnalizando(true);
      setError(null);
      try {
        // Sin OCR configurado todavía: el usuario completa los campos manualmente.
        return null;
      } catch {
        setError("No se pudo analizar el archivo. Completá los campos manualmente.");
        return null;
      } finally {
        setAnalizando(false);
      }
    },
    [],
  );

  return { analizando, error, analizar };
}

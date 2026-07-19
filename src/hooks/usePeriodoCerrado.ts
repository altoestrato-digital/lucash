"use client";

import { useMemo } from "react";
import type { Presupuesto } from "@/types/presupuesto";

export function usePeriodoCerrado(presupuesto: Presupuesto | null): boolean {
  return useMemo(() => {
    if (!presupuesto) return false;
    const hoy = new Date();
    const fin = new Date(presupuesto.fechaFin + "T23:59:59");
    return hoy > fin;
  }, [presupuesto]);
}

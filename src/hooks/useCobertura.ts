"use client";

import { useMemo } from "react";
import type { Presupuesto, ResumenCobertura } from "@/types/presupuesto";
import type { Transaccion } from "@/types/transaccion";
import type { Money } from "@/lib/money";
import { calcularCobertura } from "@/lib/cobertura";

export function useCobertura(
  presupuesto: Presupuesto | null,
  transacciones: Transaccion[],
  disponibleCarteras?: Money
): ResumenCobertura | null {
  return useMemo(() => {
    if (!presupuesto) return null;
    return calcularCobertura(presupuesto, transacciones, disponibleCarteras);
  }, [presupuesto, transacciones, disponibleCarteras]);
}

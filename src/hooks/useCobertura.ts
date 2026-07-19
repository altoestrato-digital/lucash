"use client";

import { useMemo } from "react";
import type { Presupuesto, ResumenCobertura } from "@/types/presupuesto";
import type { Transaccion } from "@/types/transaccion";
import type { Money } from "@/lib/money";
import { calcularCobertura } from "@/lib/cobertura";
import { useMonedaActiva } from "@/hooks/useMonedaActiva";

export function useCobertura(
  presupuesto: Presupuesto | null,
  transacciones: Transaccion[],
  disponibleCarteras?: Money
): ResumenCobertura | null {
  const { moneda } = useMonedaActiva();

  return useMemo(() => {
    if (!presupuesto) return null;
    return calcularCobertura(presupuesto, transacciones, disponibleCarteras, moneda);
  }, [presupuesto, transacciones, disponibleCarteras, moneda]);
}

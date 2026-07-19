"use client";

import { useMemo } from "react";
import type { Cartera } from "@/types/cartera";

export function useSaldoCartera(cartera: Cartera): number {
  return useMemo(() => cartera.saldo, [cartera.saldo]);
}

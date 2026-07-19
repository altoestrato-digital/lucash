import type { Cartera } from "@/types/cartera";

export const obtenerSaldoCartera = (cartera: Cartera): number => {
  return cartera.saldo;
};

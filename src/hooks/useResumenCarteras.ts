"use client";

import { useMemo } from "react";
import type { Cartera, ResumenCarteras, TipoCartera } from "@/types/cartera";
import { esLiquida } from "@/types/cartera";
import { convertirAUSD, convertirABs } from "@/lib/conversion";
import { toIso } from "@/lib/dates";
import { bs, usd } from "@/lib/money";

export function useResumenCarteras(carteras: Cartera[]): ResumenCarteras {
  return useMemo(() => getResumen(carteras), [carteras]);
}

export const getResumen = (carteras: Cartera[]): ResumenCarteras => {
  const hoy = toIso(new Date());
  const activas = carteras.filter((c) => c.activo);
  let totalBsNum = 0;
  let totalUsdNum = 0;
  let disponibleBsNum = 0;
  let disponibleUsdNum = 0;
  let ahorroBsNum = 0;
  let ahorroUsdNum = 0;
  const porTipo: Record<TipoCartera, number> = { efectivo: 0, banco: 0, prepago: 0, crypto: 0, inversion: 0 };

  for (const c of activas) {
    const saldoActual = c.saldo;
    const usdEq = convertirAUSD(saldoActual, c.moneda, hoy);
    const bsEq = convertirABs(usdEq, hoy);
    totalBsNum += Number(bsEq);
    totalUsdNum += Number(usdEq);
    if (esLiquida(c)) {
      disponibleBsNum += Number(bsEq);
      disponibleUsdNum += Number(usdEq);
    }
    if (c.objetivo === "ahorro") {
      ahorroBsNum += Number(bsEq);
      ahorroUsdNum += Number(usdEq);
    }
    porTipo[c.tipo]++;
  }

  return {
    totalBs: bs(totalBsNum),
    totalUsd: usd(totalUsdNum),
    disponibleBs: bs(disponibleBsNum),
    disponibleUsd: usd(disponibleUsdNum),
    ahorroBs: bs(ahorroBsNum),
    ahorroUsd: usd(ahorroUsdNum),
    cantidad: activas.length,
    porTipo,
  };
};

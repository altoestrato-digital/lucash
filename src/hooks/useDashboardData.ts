"use client";

import { useMemo } from "react";
import type { Cartera } from "@/types/cartera";
import type { Transaccion } from "@/types/transaccion";
import type { Presupuesto } from "@/types/presupuesto";
import type { DashboardData } from "@/types/dashboard";
import { getResumen } from "@/hooks/useResumenCarteras";
import { calcularCobertura } from "@/lib/cobertura";
import { toIso } from "@/lib/dates";
import { sum, bs, usd } from "@/lib/money";

export function useDashboardData(
  carteras: Cartera[],
  presupuesto: Presupuesto | null,
  transacciones: Transaccion[]
): DashboardData {
  return useMemo(() => getDashboardData(carteras, presupuesto, transacciones), [
    carteras, presupuesto, transacciones,
  ]);
}

export const getDashboardData = (
  carteras: Cartera[],
  presupuesto: Presupuesto | null,
  transacciones: Transaccion[]
): DashboardData => {
  const hoy = toIso(new Date());
  const inicioMes = hoy.slice(0, 8) + "01";

  const resumenCarteras = getResumen(carteras);
  const txsDelMes = transacciones.filter((t) => {
    const txDate = t.fecha.includes("T") ? t.fecha.slice(0, 10) : t.fecha;
    return txDate >= inicioMes && txDate <= hoy;
  });

  const egresosDelMes = txsDelMes.filter((t) => t.tipo === "egreso");

  const gastosMesBs = egresosDelMes.reduce((a, t) => sum(a, t.montoBs), bs(0));
  const gastosMesUsd = egresosDelMes.reduce((a, t) => sum(a, t.montoUsd), usd(0));

  const cobertura = presupuesto
    ? calcularCobertura(presupuesto, txsDelMes, resumenCarteras.disponibleBs)
    : null;

  const totalGastosBs = Number(gastosMesBs) || 1;

  const gastosCollection = egresosDelMes
    .reduce<Record<string, { totalBs: number; totalUsd: number; nombre: string; color: string }>>((acc, t) => {
      const key = t.categoriaId ?? "otros";
      if (!acc[key]) {
        const cat = presupuesto?.categorias.find((s) => s.id === t.categoriaId);
        acc[key] = { totalBs: 0, totalUsd: 0, nombre: cat?.nombre ?? "Otros", color: cat?.color ?? "#9CA3AF" };
      }
      acc[key].totalBs += Number(t.montoBs);
      acc[key].totalUsd += Number(t.montoUsd);
      return acc;
    }, {});

  const gastosPorCat = Object.entries(gastosCollection).map(([id, info]) => ({
    categoriaId: id,
    nombre: info.nombre,
    color: info.color,
    gastadoBs: bs(info.totalBs),
    gastadoUsd: usd(info.totalUsd),
    porcentaje: (info.totalBs / totalGastosBs) * 100,
  }));

  const ultimasTransacciones = [...transacciones]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  return {
    disponible: { bs: resumenCarteras.disponibleBs, usd: resumenCarteras.disponibleUsd },
    presupuestoCubiertoPct: cobertura && Number(cobertura.ingresoEsperadoBs) > 0
      ? Math.min(100, (Number(cobertura.ingresoRealBs) / Number(cobertura.ingresoEsperadoBs)) * 100)
      : 0,
    gastadoMesBs: gastosMesBs,
    gastadoMesUsd: gastosMesUsd,
    gastosPorCat,
    ultimasTransacciones,
  };
};

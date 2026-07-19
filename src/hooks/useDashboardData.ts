"use client";

import { useMemo } from "react";
import type { Cartera } from "@/types/cartera";
import type { Transaccion } from "@/types/transaccion";
import type { Presupuesto } from "@/types/presupuesto";
import type { DashboardData } from "@/types/dashboard";
import { getResumen } from "@/hooks/useResumenCarteras";
import { calcularCobertura } from "@/lib/cobertura";
import { toIso } from "@/lib/dates";
import { sum, bs } from "@/lib/money";

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

  const gastosMes = txsDelMes
    .filter((t) => t.tipo === "egreso")
    .reduce((a, t) => sum(a, t.montoBs), bs(0));

  const cobertura = presupuesto
    ? calcularCobertura(presupuesto, txsDelMes, resumenCarteras.disponibleBs)
    : null;

  const totalGastos = Number(gastosMes) || 1;

  const gastosCollection = txsDelMes
    .filter((t) => t.tipo === "egreso")
    .reduce<Record<string, { total: number; nombre: string; color: string }>>((acc, t) => {
      const key = t.subPresupuestoId ?? "otros";
      if (!acc[key]) {
        const sub = presupuesto?.subpresupuestos.find((s) => s.id === t.subPresupuestoId);
        acc[key] = { total: 0, nombre: sub?.nombre ?? "Otros", color: sub?.color ?? "#9CA3AF" };
      }
      acc[key].total += Number(t.montoBs);
      return acc;
    }, {});

  const gastosPorSub = Object.entries(gastosCollection).map(([id, info]) => ({
    subpresupuestoId: id,
    nombre: info.nombre,
    color: info.color,
    gastadoBs: bs(info.total),
    porcentaje: (info.total / totalGastos) * 100,
  }));

  const ultimasTransacciones = [...transacciones]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  return {
    disponible: { bs: resumenCarteras.disponibleBs, usd: resumenCarteras.disponibleUsd },
    presupuestoCubiertoPct: cobertura
      ? Math.min(100, (Number(cobertura.ingresoRealBs) / Number(cobertura.ingresoEsperadoBs ?? 1)) * 100)
      : 0,
    gastadoMesBs: gastosMes,
    gastosPorSub,
    ultimasTransacciones,
  };
};

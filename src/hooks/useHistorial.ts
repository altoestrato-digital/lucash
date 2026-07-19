"use client";

import { useMemo, useCallback, useEffect, useState } from "react";
import type { Transaccion } from "@/types/transaccion";
import type { FiltroHistorial, ResumenHistorial, Periodo } from "@/types/historial";
import type { Money } from "@/lib/money";
import { transaccionesRepo, subscribe } from "@/lib/db";
import { sum, sub, bs, usd } from "@/lib/money";
import type { Presupuesto } from "@/types/presupuesto";

const FILTROS_KEY = "lucash:filtros-historial";

const filtroDefault: FiltroHistorial = {
  periodo: { tipo: "presupuesto" },
  tipo: "todos",
  subPresupuestoId: "todos",
  carteraId: "todos",
};

function matchesFiltro(tx: Transaccion, filtro: FiltroHistorial): boolean {
  if (filtro.tipo !== "todos" && tx.tipo !== filtro.tipo) return false;
  if (filtro.subPresupuestoId !== "todos") {
    if (filtro.subPresupuestoId === "general" && tx.subPresupuestoId !== null) return false;
    if (filtro.subPresupuestoId !== "general" && tx.subPresupuestoId !== filtro.subPresupuestoId) return false;
  }
  if (filtro.carteraId !== "todos" && tx.carteraId !== filtro.carteraId) return false;
  return true;
}

function getPeriodoRange(
  periodo: Periodo,
  presupuesto: Presupuesto | null,
): { desde: string; hasta: string } | null {
  if (periodo.tipo === "todas") return null;
  if (periodo.tipo === "rango") {
    if (!periodo.desde || !periodo.hasta) return null;
    return { desde: periodo.desde, hasta: periodo.hasta };
  }
  if (periodo.tipo === "presupuesto" && presupuesto) {
    return { desde: presupuesto.fechaInicio, hasta: presupuesto.fechaFin };
  }
  return null;
}

function loadFiltro(): FiltroHistorial {
  if (typeof window === "undefined") return filtroDefault;
  try {
    const raw = localStorage.getItem(FILTROS_KEY);
    if (raw) return { ...filtroDefault, ...(JSON.parse(raw) as Partial<FiltroHistorial>) };
  } catch {
    /* ignore */
  }
  return filtroDefault;
}

export function useTransacciones(): Transaccion[] {
  const [transacciones, setTransacciones] = useState<Transaccion[]>(() => transaccionesRepo.list());
  useEffect(() => {
    return subscribe(() => setTransacciones(transaccionesRepo.list()));
  }, []);
  return transacciones;
}

export function useHistorial(presupuesto: Presupuesto | null) {
  const transacciones = useTransacciones();
  const [filtro, setFiltroState] = useState<FiltroHistorial>(() => loadFiltro());

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(FILTROS_KEY, JSON.stringify(filtro));
  }, [filtro]);

  const rango = useMemo(
    () => getPeriodoRange(filtro.periodo, presupuesto),
    [filtro.periodo, presupuesto],
  );

  const filtradas = useMemo(() => {
    let result = transacciones;
    if (rango) {
      result = result.filter((tx) => tx.fecha >= rango.desde && tx.fecha <= rango.hasta);
    }
    return result.filter((tx) => matchesFiltro(tx, filtro));
  }, [transacciones, rango, filtro]);

  const resumen = useMemo((): ResumenHistorial => {
    let ingresosBs: Money = bs(0);
    let egresosBs: Money = bs(0);
    let ingresosUsd: Money = usd(0);
    let egresosUsd: Money = usd(0);

    for (const tx of filtradas) {
      if (tx.tipo === "ingreso") {
        ingresosBs = sum(ingresosBs, tx.montoBs);
        ingresosUsd = sum(ingresosUsd, tx.montoUsd);
      } else {
        egresosBs = sum(egresosBs, tx.montoBs);
        egresosUsd = sum(egresosUsd, tx.montoUsd);
      }
    }

    return {
      ingresosBs,
      egresosBs,
      balanceBs: sub(ingresosBs, egresosBs),
      ingresosUsd,
      egresosUsd,
      balanceUsd: sub(ingresosUsd, egresosUsd),
      cantidad: filtradas.length,
    };
  }, [filtradas]);

  const setPeriodo = useCallback((periodo: Periodo) => {
    setFiltroState((prev) => ({ ...prev, periodo }));
  }, []);

  const setFiltroTipo = useCallback((tipo: FiltroHistorial["tipo"]) => {
    setFiltroState((prev) => ({ ...prev, tipo }));
  }, []);

  const setFiltroSub = useCallback((subPresupuestoId: FiltroHistorial["subPresupuestoId"]) => {
    setFiltroState((prev) => ({ ...prev, subPresupuestoId }));
  }, []);

  const setFiltroCartera = useCallback((carteraId: FiltroHistorial["carteraId"]) => {
    setFiltroState((prev) => ({ ...prev, carteraId }));
  }, []);

  const limpiarFiltros = useCallback(() => {
    setFiltroState((prev) => ({ ...prev, tipo: "todos", subPresupuestoId: "todos", carteraId: "todos" }));
  }, []);

  const tieneFiltrosActivos =
    filtro.tipo !== "todos" ||
    filtro.subPresupuestoId !== "todos" ||
    filtro.carteraId !== "todos";

  return {
    filtradas,
    resumen,
    filtro,
    setPeriodo,
    setFiltroTipo,
    setFiltroSub,
    setFiltroCartera,
    limpiarFiltros,
    tieneFiltrosActivos,
  };
}

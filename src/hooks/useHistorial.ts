"use client";

import { useMemo, useCallback, useEffect, useState } from "react";
import type { Transaccion } from "@/types/transaccion";
import type { FiltroHistorial, ResumenHistorial, Periodo } from "@/types/historial";
import type { Money } from "@/lib/money";
import { transaccionesRepo, carterasRepo, subscribe } from "@/lib/db";
import { sum, sub, bs, usd } from "@/lib/money";
import type { Presupuesto } from "@/types/presupuesto";
import { getRangoPorPresupuesto } from "@/lib/periodo";
import { usePreferencias } from "@/hooks/usePreferencias";

const FILTROS_KEY = "lucash:filtros-historial";

const filtroDefault: FiltroHistorial = {
  periodo: { tipo: "presupuesto" },
  tipo: "todos",
  categoriaId: "todos",
  carteraId: "todos",
};

function matchesFiltro(tx: Transaccion, filtro: FiltroHistorial): boolean {
  if (filtro.tipo !== "todos" && tx.tipo !== filtro.tipo) return false;
  if (filtro.categoriaId !== "todos") {
    if (filtro.categoriaId === "general" && tx.categoriaId !== null) return false;
    if (filtro.categoriaId !== "general" && tx.categoriaId !== filtro.categoriaId) return false;
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
    const r = getRangoPorPresupuesto(presupuesto);
    return { desde: r.desde, hasta: r.hasta };
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

export function useTransacciones(filtrarPorEspacio = true): Transaccion[] {
  const { preferencias } = usePreferencias();
  const espacioId = filtrarPorEspacio ? preferencias.espacioTrabajoId : null;
  const [transaccionesAll, setTransaccionesAll] = useState<Transaccion[]>(() => transaccionesRepo.list());
  const [carterasAll, setCarterasAll] = useState(() => carterasRepo.list());

  useEffect(() => {
    return subscribe(() => {
      setTransaccionesAll(transaccionesRepo.list());
      setCarterasAll(carterasRepo.list());
    });
  }, []);

  if (!espacioId) return transaccionesAll;

  const carterasIds = new Set(
    carterasAll
      .filter((c) => c.espacioTrabajoId === espacioId)
      .map((c) => c.id),
  );
  return transaccionesAll.filter((tx) => carterasIds.has(tx.carteraId));
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
      const hastaCompleto = rango.hasta + "T23:59:59";
      result = result.filter((tx) => tx.fecha >= rango.desde && tx.fecha <= hastaCompleto);
    }
    return result.filter((tx) => matchesFiltro(tx, filtro));
  }, [transacciones, rango, filtro]);

  const resumen = useMemo((): ResumenHistorial => {
    let ingresosBs: Money = bs(0);
    let egresosBs: Money = bs(0);
    let ingresosUsd: Money = usd(0);
    let egresosUsd: Money = usd(0);

    // Get all carteras for currency lookup
    const allCarteras = carterasRepo.list();
    const carterasMap = new Map(allCarteras.map(c => [c.id, c]));

    for (const tx of filtradas) {
      const cartera = carterasMap.get(tx.carteraId);
      const esBs = cartera?.moneda === "Bs";
      const esUsd = cartera?.moneda === "USD" || cartera?.moneda === "USDT";

      if (tx.tipo === "ingreso") {
        if (esBs) {
          ingresosBs = sum(ingresosBs, bs(tx.montoOriginal));
        } else if (esUsd) {
          ingresosUsd = sum(ingresosUsd, usd(tx.montoOriginal));
        }
      } else {
        if (esBs) {
          egresosBs = sum(egresosBs, bs(tx.montoOriginal));
        } else if (esUsd) {
          egresosUsd = sum(egresosUsd, usd(tx.montoOriginal));
        }
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

  const setFiltroCategoria = useCallback((categoriaId: FiltroHistorial["categoriaId"]) => {
    setFiltroState((prev) => ({ ...prev, categoriaId }));
  }, []);

  const setFiltroCartera = useCallback((carteraId: FiltroHistorial["carteraId"]) => {
    setFiltroState((prev) => ({ ...prev, carteraId }));
  }, []);

  const limpiarFiltros = useCallback(() => {
    setFiltroState((prev) => ({ ...prev, tipo: "todos", categoriaId: "todos", carteraId: "todos" }));
  }, []);

  const tieneFiltrosActivos =
    filtro.tipo !== "todos" ||
    filtro.categoriaId !== "todos" ||
    filtro.carteraId !== "todos";

  return {
    filtradas,
    resumen,
    filtro,
    setPeriodo,
    setFiltroTipo,
    setFiltroCategoria,
    setFiltroCartera,
    limpiarFiltros,
    tieneFiltrosActivos,
  };
}

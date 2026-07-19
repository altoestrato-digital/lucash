"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  Cartera,
  CarteraId,
  CarteraInput,
  MetaCartera,
  MetaCarteraId,
  MetaCarteraInput,
  MovimientoCartera,
  MovimientoCarteraId,
} from "@/types/cartera";
import { carterasRepo, metasRepo, movimientosRepo, subscribe } from "@/lib/db";
import { usePreferencias } from "@/hooks/usePreferencias";

export function useCarteras(filtrarPorEspacio = true) {
  const { preferencias } = usePreferencias();
  const espacioId = filtrarPorEspacio ? preferencias.espacioTrabajoId : null;

  const [carterasAll, setCarterasAll] = useState<Cartera[]>(() => carterasRepo.list());
  const [metas, setMetas] = useState<MetaCartera[]>(() => metasRepo.list());
  const [movimientos, setMovimientos] = useState<MovimientoCartera[]>(() => movimientosRepo.list());

  useEffect(() => {
    return subscribe(() => {
      setCarterasAll(carterasRepo.list());
      setMetas(metasRepo.list());
      setMovimientos(movimientosRepo.list());
    });
  }, []);

  const carteras = espacioId
    ? carterasAll.filter((c) => c.espacioTrabajoId === espacioId || c.espacioTrabajoId == null)
    : carterasAll;

  const addCartera = useCallback((c: CarteraInput): Cartera => {
    return carterasRepo.add(c);
  }, []);

  const updateCartera = useCallback((id: CarteraId, data: Partial<Cartera>) => {
    carterasRepo.update(id, data);
  }, []);

  const softDeleteCartera = useCallback((id: CarteraId) => {
    carterasRepo.softDelete(id);
  }, []);

  const addMeta = useCallback((m: MetaCarteraInput): MetaCartera => {
    return metasRepo.add(m);
  }, []);

  const updateMeta = useCallback((id: MetaCarteraId, data: Partial<MetaCartera>) => {
    metasRepo.update(id, data);
  }, []);

  const deleteMeta = useCallback((id: MetaCarteraId) => {
    metasRepo.delete(id);
  }, []);

  const addMovimiento = useCallback((
    m: Omit<MovimientoCartera, "id" | "createdAt" | "updatedAt" | "saldoPrevio" | "saldoPosterior" | "monedaCartera"> & {
      monedaCartera?: MovimientoCartera["monedaCartera"];
    }
  ): MovimientoCartera => {
    return movimientosRepo.add(m);
  }, []);

  return {
    carteras,
    metas,
    movimientos,
    addCartera,
    updateCartera,
    softDeleteCartera,
    addMeta,
    updateMeta,
    deleteMeta,
    addMovimiento,
  };
}

export const getCarterasActivas = (carteras: Cartera[]) => carteras.filter((c) => c.activo);

export type { CarteraId, MetaCarteraId, MovimientoCarteraId };

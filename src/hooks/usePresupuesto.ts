"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  Categoria,
  CategoriaDetalle,
  Presupuesto,
  PresupuestoSnapshot,
} from "@/types/presupuesto";
import { presupuestoRepo, snapshotsRepo, categoriasRepo, categoriaDetallesRepo, subscribe, isDBReady } from "@/lib/db";
import type { CategoriaId, CategoriaDetalleId } from "@/types/transaccion";
import type { EspacioTrabajoId } from "@/types/espacio-trabajo";
import { calcularRangoPeriodo } from "@/lib/presupuesto-fechas";
import { bs } from "@/lib/money";
import { usePreferencias } from "@/hooks/usePreferencias";

export function usePresupuesto(filtrarPorEspacio = true) {
  const { preferencias } = usePreferencias();
  const espacioId = filtrarPorEspacio ? preferencias.espacioTrabajoId : null;

  const [presupuestoAll, setPresupuestoAll] = useState<Presupuesto | null>(() =>
    presupuestoRepo.getActual(),
  );
  const [snapshots, setSnapshots] = useState<PresupuestoSnapshot[]>(() => snapshotsRepo.list());

  useEffect(() => {
    return subscribe(() => {
      setPresupuestoAll(presupuestoRepo.getActual());
      setSnapshots(snapshotsRepo.list());
    });
  }, []);

  const presupuesto = espacioId
    ? presupuestoAll && presupuestoAll.espacioTrabajoId === espacioId
      ? presupuestoAll
      : null
    : presupuestoAll;

  const updatePresupuesto = useCallback((data: Partial<Presupuesto>) => {
    if (!isDBReady()) return;
    const current = presupuestoRepo.getActual();
    const currentBelongsToWorkspace = current && espacioId
      ? current.espacioTrabajoId === espacioId
      : true;
    if (current && currentBelongsToWorkspace) {
      const merged: Omit<Presupuesto, "id" | "createdAt"> = {
        ...current,
        ...data,
        espacioTrabajoId: (data.espacioTrabajoId ?? current.espacioTrabajoId ?? (espacioId || undefined)) as EspacioTrabajoId | undefined,
        categorias: data.categorias ?? current.categorias,
      };
      presupuestoRepo.upsert(merged);
    } else {
      const withEspacio: Omit<Presupuesto, "id" | "createdAt"> = {
        ...data,
        espacioTrabajoId: data.espacioTrabajoId ?? espacioId,
      } as Omit<Presupuesto, "id" | "createdAt">;
      presupuestoRepo.upsert(withEspacio);
    }
  }, [espacioId]);

  const addCategoria = useCallback((cat: Omit<Categoria, "id" | "activo"> & { presupuestoId: string }) => {
    categoriasRepo.add(cat);
  }, []);

  const updateCategoria = useCallback((id: string, data: Partial<Categoria>) => {
    categoriasRepo.update(id as CategoriaId, data);
  }, []);

  const softDeleteCategoria = useCallback((id: string) => {
    categoriasRepo.softDelete(id as CategoriaId);
  }, []);

  const listCategoriaDetalles = useCallback((categoriaId: string): CategoriaDetalle[] => {
    return categoriaDetallesRepo.listByCategoria(categoriaId);
  }, []);

  const addCategoriaDetalle = useCallback((data: Omit<CategoriaDetalle, "id" | "activo"> & { categoriaId: string }) => {
    return categoriaDetallesRepo.add(data);
  }, []);

  const updateCategoriaDetalle = useCallback((id: string, data: Partial<CategoriaDetalle>) => {
    categoriaDetallesRepo.update(id as CategoriaDetalleId, data);
  }, []);

  const softDeleteCategoriaDetalle = useCallback((id: string) => {
    categoriaDetallesRepo.softDelete(id as CategoriaDetalleId);
  }, []);

  const cerrarPeriodo = useCallback(() => {
    const current = presupuestoRepo.getActual();
    if (!current) return;

    const now = new Date().toISOString();
    const snapshot: PresupuestoSnapshot = {
      id: `snap-${Date.now()}`,
      presupuestoIdOrigen: current.id,
      periodicidad: current.periodicidad,
      fechaInicio: current.fechaInicio,
      fechaFin: current.fechaFin,
      ingresoEsperado: current.ingresoEsperado,
      ingresoEsperadoMoneda: current.ingresoEsperadoMoneda,
      ingresoRealBs: bs(0),
      gastoMaximoEsperado: current.gastoMaximoEsperado,
      gastoMaximoEsperadoMoneda: current.gastoMaximoEsperadoMoneda,
      categorias: [...current.categorias],
      transaccionesIds: [],
      balanceBs: bs(0),
      createdAt: now,
      updatedAt: now,
    };
    const siguienteRango = calcularRangoPeriodo(
      new Date(current.fechaFin + "T12:00:00"),
      current.periodicidad,
      current.quincenaCorteDia,
    );

    presupuestoRepo.cerrarPeriodoConSnapshot(
      current.id,
      now,
      snapshot,
      {
        usuarioId: current.usuarioId,
        espacioTrabajoId: current.espacioTrabajoId,
        nombre: current.nombre,
        periodicidad: current.periodicidad,
        ingresoEsperado: current.ingresoEsperado,
        ingresoEsperadoMoneda: current.ingresoEsperadoMoneda,
        gastoMaximoEsperado: current.gastoMaximoEsperado,
        gastoMaximoEsperadoMoneda: current.gastoMaximoEsperadoMoneda,
        fechaInicio: siguienteRango.fechaInicio,
        fechaFin: siguienteRango.fechaFin,
        quincenaCorteDia: current.quincenaCorteDia,
        categorias: current.categorias.filter((s) => s.recurrente).map((s) => ({ ...s })),
      },
    );
  }, []);

  return {
    presupuesto,
    snapshots,
    updatePresupuesto,
    addCategoria,
    updateCategoria,
    softDeleteCategoria,
    listCategoriaDetalles,
    addCategoriaDetalle,
    updateCategoriaDetalle,
    softDeleteCategoriaDetalle,
    cerrarPeriodo,
  };
}

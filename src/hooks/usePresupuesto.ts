"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  Categoria,
  CategoriaDetalle,
  Presupuesto,
  PresupuestoSnapshot,
} from "@/types/presupuesto";
import { presupuestoRepo, snapshotsRepo, categoriasRepo, categoriaDetallesRepo, transaccionesRepo, subscribe, isDBReady } from "@/lib/db";
import type { ISODate } from "@/lib/dates";
import type { CategoriaId, CategoriaDetalleId } from "@/types/transaccion";
import type { EspacioTrabajoId } from "@/types/espacio-trabajo";
import { calcularRangoPeriodo } from "@/lib/presupuesto-fechas";
import { calcularCobertura } from "@/lib/cobertura";
import { toIso } from "@/lib/dates";
import { usePreferencias } from "@/hooks/usePreferencias";

export function usePresupuesto(filtrarPorEspacio = true) {
  const { preferencias } = usePreferencias();
  const espacioId = filtrarPorEspacio ? preferencias.espacioTrabajoId : null;

  const [presupuestoAll, setPresupuestoAll] = useState<Presupuesto | null>(() =>
    presupuestoRepo.getActual(espacioId),
  );
  const [snapshots, setSnapshots] = useState<PresupuestoSnapshot[]>(() => snapshotsRepo.list());

  useEffect(() => {
    return subscribe(() => {
      setPresupuestoAll(presupuestoRepo.getActual(espacioId));
      setSnapshots(snapshotsRepo.list());
    });
  }, [espacioId]);

  const presupuesto = useMemo(
    () =>
      espacioId
        ? presupuestoAll && presupuestoAll.espacioTrabajoId === espacioId
          ? presupuestoAll
          : null
        : presupuestoAll,
    [presupuestoAll, espacioId]
  );

  const updatePresupuesto = useCallback((data: Partial<Presupuesto>) => {
    if (!isDBReady()) return;
    const targetWorkspace = data.espacioTrabajoId ?? espacioId;
    const current = presupuestoRepo.getActual(targetWorkspace);
    if (current) {
      const merged: Omit<Presupuesto, "id" | "createdAt"> = {
        ...current,
        ...data,
        espacioTrabajoId: (data.espacioTrabajoId ?? current.espacioTrabajoId ?? (espacioId || undefined)) as EspacioTrabajoId | undefined,
        categorias: data.categorias ?? current.categorias,
      };
      presupuestoRepo.upsert(merged, targetWorkspace);
    } else {
      const withEspacio: Omit<Presupuesto, "id" | "createdAt"> = {
        ...data,
        espacioTrabajoId: data.espacioTrabajoId ?? espacioId,
      } as Omit<Presupuesto, "id" | "createdAt">;
      presupuestoRepo.upsert(withEspacio, targetWorkspace);
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
    const current = presupuestoRepo.getActual(espacioId);
    if (!current) return;

    const txsCerradas = transaccionesRepo.list().filter((t) => {
      const fechaSolo = t.fecha.slice(0, 10) as ISODate;
      return fechaSolo >= current.fechaInicio && fechaSolo <= current.fechaFin;
    });
    const coberturaCerrada = calcularCobertura(current, txsCerradas);

    const now = new Date().toISOString();
    const snapshot: PresupuestoSnapshot = {
      id: `snap-${Date.now()}`,
      presupuestoIdOrigen: current.id,
      periodicidad: current.periodicidad,
      fechaInicio: current.fechaInicio,
      fechaFin: current.fechaFin,
      ingresoEsperado: current.ingresoEsperado,
      ingresoEsperadoMoneda: current.ingresoEsperadoMoneda,
      ingresoRealBs: coberturaCerrada.ingresoRealBs,
      gastoMaximoEsperado: current.gastoMaximoEsperado,
      gastoMaximoEsperadoMoneda: current.gastoMaximoEsperadoMoneda,
      categorias: [...current.categorias],
      transaccionesIds: txsCerradas.map((t) => t.id),
      balanceBs: coberturaCerrada.balanceBs,
      createdAt: now,
      updatedAt: now,
    };

    let siguienteFechaInicio = current.fechaInicio;
    let siguienteFechaFin = current.fechaFin;

    if (current.periodicidad === "rango" && current.persistente) {
      const duracionMs = new Date(current.fechaFin + "T12:00:00").getTime() - new Date(current.fechaInicio + "T12:00:00").getTime();
      const nuevoInicio = new Date(current.fechaFin + "T12:00:00");
      nuevoInicio.setDate(nuevoInicio.getDate() + 1);
      const nuevoFin = new Date(nuevoInicio.getTime() + duracionMs);
      siguienteFechaInicio = toIso(nuevoInicio);
      siguienteFechaFin = toIso(nuevoFin);
    } else if (current.periodicidad !== "rango") {
      const sig = calcularRangoPeriodo(
        new Date(current.fechaFin + "T12:00:00"),
        current.periodicidad,
        current.quincenaCorteDia,
      );
      siguienteFechaInicio = sig.fechaInicio;
      siguienteFechaFin = sig.fechaFin;
    }

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
        fechaInicio: siguienteFechaInicio,
        fechaFin: siguienteFechaFin,
        quincenaCorteDia: current.quincenaCorteDia,
        persistente: current.persistente,
        categorias: current.categorias.filter((s) => s.recurrente).map((s) => ({ ...s })),
      },
    );
  }, [espacioId]);

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

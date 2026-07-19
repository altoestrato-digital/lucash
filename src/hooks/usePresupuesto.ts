"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  Categoria,
  Presupuesto,
  PresupuestoSnapshot,
} from "@/types/presupuesto";
import { presupuestoRepo, snapshotsRepo, categoriasRepo, subscribe, isDBReady } from "@/lib/db";
import type { CategoriaId } from "@/types/transaccion";
import { calcularRangoPeriodo } from "@/lib/presupuesto-fechas";
import { bs } from "@/lib/money";

export function usePresupuesto() {
  const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(() =>
    presupuestoRepo.getActual(),
  );
  const [snapshots, setSnapshots] = useState<PresupuestoSnapshot[]>(() => snapshotsRepo.list());

  useEffect(() => {
    return subscribe(() => {
      setPresupuesto(presupuestoRepo.getActual());
      setSnapshots(snapshotsRepo.list());
    });
  }, []);

  const updatePresupuesto = useCallback((data: Partial<Presupuesto>) => {
    if (!isDBReady()) return;
    const current = presupuestoRepo.getActual();
    if (current) {
      const merged: Omit<Presupuesto, "id" | "createdAt"> = {
        ...current,
        ...data,
        categorias: data.categorias ?? current.categorias,
      };
      presupuestoRepo.upsert(merged);
    } else {
      presupuestoRepo.upsert(data as Omit<Presupuesto, "id" | "createdAt">);
    }
  }, []);

  const addCategoria = useCallback((cat: Omit<Categoria, "id" | "activo"> & { presupuestoId: string }) => {
    categoriasRepo.add(cat);
  }, []);

  const updateCategoria = useCallback((id: string, data: Partial<Categoria>) => {
    categoriasRepo.update(id as CategoriaId, data);
  }, []);

  const softDeleteCategoria = useCallback((id: string) => {
    categoriasRepo.softDelete(id as CategoriaId);
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
    cerrarPeriodo,
  };
}

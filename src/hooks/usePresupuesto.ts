"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  Presupuesto,
  PresupuestoSnapshot,
  Subpresupuesto,
} from "@/types/presupuesto";
import { presupuestoRepo, snapshotsRepo, subpresupuestosRepo, subscribe, isDBReady } from "@/lib/db";
import type { SubpresupuestoId } from "@/types/transaccion";
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
        subpresupuestos: data.subpresupuestos ?? current.subpresupuestos,
      };
      presupuestoRepo.upsert(merged);
    } else {
      presupuestoRepo.upsert(data as Omit<Presupuesto, "id" | "createdAt">);
    }
  }, []);

  const addSubpresupuesto = useCallback((sub: Omit<Subpresupuesto, "id"> & { presupuestoId: string }) => {
    subpresupuestosRepo.add(sub);
  }, []);

  const updateSubpresupuesto = useCallback((id: string, data: Partial<Subpresupuesto>) => {
    subpresupuestosRepo.update(id as SubpresupuestoId, data);
  }, []);

  const softDeleteSubpresupuesto = useCallback((id: string) => {
    subpresupuestosRepo.softDelete(id as SubpresupuestoId);
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
      subpresupuestos: [...current.subpresupuestos],
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
        subpresupuestos: current.subpresupuestos.filter((s) => s.recurrente).map((s) => ({ ...s })),
      },
    );
  }, []);

  return {
    presupuesto,
    snapshots,
    updatePresupuesto,
    addSubpresupuesto,
    updateSubpresupuesto,
    softDeleteSubpresupuesto,
    cerrarPeriodo,
  };
}

"use client";

import { useState, useCallback } from "react";
import { usePresupuesto } from "@/hooks/usePresupuesto";
import { useCobertura } from "@/hooks/useCobertura";
import { usePeriodoCerrado } from "@/hooks/usePeriodoCerrado";
import { useTransacciones } from "@/hooks/useHistorial";
import { useCarteras } from "@/hooks/useCarteras";
import { getResumen } from "@/hooks/useResumenCarteras";
import { usePreferencias } from "@/hooks/usePreferencias";
import { toIso } from "@/lib/dates";
import { bs } from "@/lib/money";
import { useUIStore } from "@/stores/ui";
import type { Subpresupuesto } from "@/types/presupuesto";
import PresupuestoHeader from "@/components/presupuestos/PresupuestoHeader";
import PresupuestosTabs from "@/components/presupuestos/PresupuestosTabs";
import PresupuestoResumen from "@/components/presupuestos/PresupuestoResumen";
import PresupuestoEditor from "@/components/presupuestos/PresupuestoEditor";
import SubpresupuestoEditor from "@/components/presupuestos/SubpresupuestoEditor";
import SnapshotBanner from "@/components/presupuestos/SnapshotBanner";

export default function PresupuestosPage() {
  const {
    presupuesto,
    updatePresupuesto,
    addSubpresupuesto,
    updateSubpresupuesto,
    softDeleteSubpresupuesto,
    cerrarPeriodo,
  } = usePresupuesto();

  const pushToast = useUIStore((s) => s.pushToast);

  const [tab, setTab] = useState("Resumen");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subpresupuesto | undefined>(undefined);

  const transacciones = useTransacciones();
  const { carteras } = useCarteras();
  const resumenCarteras = getResumen(carteras);
  const { preferencias, setCoberturaModo } = usePreferencias();

  const carterasCubrir = carteras.filter((c) => c.activo && c.objetivo === "cubrir-presupuesto");
  const disponibleCubrirBs = bs(carterasCubrir.reduce((acc, c) => acc + c.saldo, 0));

  const disponibleFinal = preferencias.coberturaModo === "carteras-cubrir" ? resumenCarteras.disponibleBs : disponibleCubrirBs;

  const cobertura = useCobertura(presupuesto, transacciones, disponibleFinal);
  const periodoCerrado = usePeriodoCerrado(presupuesto);

  const handleSave = useCallback((data: Partial<typeof presupuesto>) => {
    if (data) updatePresupuesto(data);
    pushToast({ tone: "success", message: "Presupuesto actualizado" });
  }, [updatePresupuesto, pushToast]);

  const handleAddSub = useCallback(() => {
    setEditingSub(undefined);
    setModalOpen(true);
  }, []);

  const handleEditSub = useCallback((sub: Subpresupuesto) => {
    setEditingSub(sub);
    setModalOpen(true);
  }, []);

  type SubDraft = Omit<Subpresupuesto, "id" | "activo">;
  const handleSaveSub = useCallback((data: SubDraft) => {
    if (editingSub) {
      updateSubpresupuesto(editingSub.id, data);
      pushToast({ tone: "success", message: "Sub-presupuesto actualizado" });
    } else if (presupuesto) {
      addSubpresupuesto({ ...data, presupuestoId: presupuesto.id } as Omit<Subpresupuesto, "id"> & { presupuestoId: string });
      pushToast({ tone: "success", message: "Sub-presupuesto creado" });
    }
    setModalOpen(false);
    setEditingSub(undefined);
  }, [editingSub, presupuesto, updateSubpresupuesto, addSubpresupuesto, pushToast]);

  const handleDeleteSub = useCallback((id: string) => {
    softDeleteSubpresupuesto(id);
  }, [softDeleteSubpresupuesto]);

  const handleEmpezarNuevo = useCallback(() => {
    cerrarPeriodo();
    pushToast({ tone: "success", message: "Período cerrado. Nuevo ciclo iniciado." });
  }, [cerrarPeriodo, pushToast]);

  if (!presupuesto) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6 text-center">
        <p className="text-muted text-sm">No hay presupuesto activo.</p>
        <button
          onClick={() => {
            const hoy = new Date();
            const inicio = toIso(hoy);
            const fin = toIso(new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0));
            updatePresupuesto({
              nombre: "Presupuesto general",
              periodicidad: "mensual",
              ingresoEsperado: bs(0),
              ingresoEsperadoMoneda: "Bs",
              gastoMaximoEsperado: bs(0),
              gastoMaximoEsperadoMoneda: "Bs",
              fechaInicio: inicio,
              fechaFin: fin,
              subpresupuestos: [],
            });
          }}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
        >
          Crear presupuesto
        </button>
      </div>
    );
  }

  return (
    <div>
      {cobertura && (
        <PresupuestoHeader
          presupuesto={presupuesto}
          ingresoRealBs={cobertura.ingresoRealBs}
          gastoRealBs={cobertura.gastoTotalBs}
        />
      )}

      <div className="px-4 py-6 space-y-6">
        <PresupuestosTabs active={tab} onChange={setTab} />

        {periodoCerrado && tab === "Resumen" && (
          <SnapshotBanner presupuesto={presupuesto} onEmpezarNuevo={handleEmpezarNuevo} />
        )}

        {tab === "Resumen" && (
          <PresupuestoResumen
            cobertura={cobertura}
            presupuesto={presupuesto}
            fuenteDisponible={preferencias.coberturaModo}
            onFuenteChange={setCoberturaModo}
          />
        )}

        {tab === "Editar" && (
          <PresupuestoEditor
            presupuesto={presupuesto}
            onSave={handleSave}
            onAddSub={handleAddSub}
            onEditSub={handleEditSub}
            onDeleteSub={handleDeleteSub}
          />
        )}

      <SubpresupuestoEditor
        open={modalOpen}
        sub={editingSub}
        presupuestoSubs={presupuesto?.subpresupuestos ?? []}
        gastoMaximoEsperado={Number(presupuesto?.gastoMaximoEsperado ?? 0)}
        gastoMaximoEsperadoMoneda={presupuesto?.gastoMaximoEsperadoMoneda ?? "Bs"}
        onSave={handleSaveSub}
        onClose={() => { setModalOpen(false); setEditingSub(undefined); }}
      />
      </div>
    </div>
  );
}

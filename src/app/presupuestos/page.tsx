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
import type { Categoria } from "@/types/presupuesto";
import PresupuestoHeader from "@/components/presupuestos/PresupuestoHeader";
import PresupuestosTabs from "@/components/presupuestos/PresupuestosTabs";
import PresupuestoResumen from "@/components/presupuestos/PresupuestoResumen";
import PresupuestoEditor from "@/components/presupuestos/PresupuestoEditor";
import CategoriaEditor from "@/components/presupuestos/CategoriaEditor";
import SnapshotBanner from "@/components/presupuestos/SnapshotBanner";

export default function PresupuestosPage() {
  const {
    presupuesto,
    updatePresupuesto,
    addCategoria,
    updateCategoria,
    softDeleteCategoria,
    cerrarPeriodo,
  } = usePresupuesto();

  const pushToast = useUIStore((s) => s.pushToast);

  const [tab, setTab] = useState("Resumen");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Categoria | undefined>(undefined);

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

  const handleAddCat = useCallback(() => {
    setEditingCat(undefined);
    setModalOpen(true);
  }, []);

  const handleEditCat = useCallback((cat: Categoria) => {
    setEditingCat(cat);
    setModalOpen(true);
  }, []);

  type CatDraft = Omit<Categoria, "id" | "activo" | "presupuestoId">;
  const handleSaveCat = useCallback((data: CatDraft) => {
    if (editingCat) {
      updateCategoria(editingCat.id, data);
      pushToast({ tone: "success", message: "Categoria actualizada" });
    } else if (presupuesto) {
      addCategoria({ ...data, presupuestoId: presupuesto.id });
      pushToast({ tone: "success", message: "Categoria creada" });
    }
    setModalOpen(false);
    setEditingCat(undefined);
  }, [editingCat, presupuesto, updateCategoria, addCategoria, pushToast]);

  const handleDeleteCat = useCallback((id: string) => {
    softDeleteCategoria(id);
  }, [softDeleteCategoria]);

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
              categorias: [],
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
            onAddCat={handleAddCat}
            onEditCat={handleEditCat}
            onDeleteCat={handleDeleteCat}
          />
        )}

      <CategoriaEditor
        open={modalOpen}
        cat={editingCat}
        presupuestoCats={presupuesto?.categorias ?? []}
        gastoMaximoEsperado={Number(presupuesto?.gastoMaximoEsperado ?? 0)}
        gastoMaximoEsperadoMoneda={presupuesto?.gastoMaximoEsperadoMoneda ?? "Bs"}
        onSave={handleSaveCat}
        onClose={() => { setModalOpen(false); setEditingCat(undefined); }}
      />
      </div>
    </div>
  );
}

"use client";

import { useState, useCallback, useMemo } from "react";
import { usePresupuesto } from "@/hooks/usePresupuesto";
import { useCobertura } from "@/hooks/useCobertura";
import { usePeriodoCerrado } from "@/hooks/usePeriodoCerrado";
import { useTransacciones } from "@/hooks/useHistorial";
import { useCarteras } from "@/hooks/useCarteras";
import { useResumenCarteras } from "@/hooks/useResumenCarteras";
import { usePreferencias } from "@/hooks/usePreferencias";
import { toIso } from "@/lib/dates";
import { bs, usd } from "@/lib/money";
import { convertirAMoneyValues } from "@/lib/conversion";
import { sum } from "@/lib/money";
import { useUIStore } from "@/stores/ui";
import type { Categoria, CategoriaDetalle } from "@/types/presupuesto";
import PresupuestoHeader from "@/components/presupuestos/PresupuestoHeader";
import PresupuestosTabs from "@/components/presupuestos/PresupuestosTabs";
import PresupuestoResumen from "@/components/presupuestos/PresupuestoResumen";
import PresupuestoEditor from "@/components/presupuestos/PresupuestoEditor";
import CategoriaEditor from "@/components/presupuestos/CategoriaEditor";
import CategoriaDetalleEditor from "@/components/presupuestos/CategoriaDetalleEditor";
import SnapshotBanner from "@/components/presupuestos/SnapshotBanner";

export default function PresupuestosPage() {
  const {
    presupuesto,
    version,
    updatePresupuesto,
    addCategoria,
    updateCategoria,
    softDeleteCategoria,
    cerrarPeriodo,
    listCategoriaDetalles,
    addCategoriaDetalle,
    updateCategoriaDetalle,
    softDeleteCategoriaDetalle,
  } = usePresupuesto();

  const pushToast = useUIStore((s) => s.pushToast);

  const transacciones = useTransacciones();
  const { carteras } = useCarteras();
  const resumenCarteras = useResumenCarteras(carteras);
  const { preferencias, setCoberturaModo } = usePreferencias();

  const [tab, setTab] = useState("Resumen");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Categoria | undefined>(undefined);
  const [detalleModalOpen, setDetalleModalOpen] = useState(false);
  const [detalleCategoria, setDetalleCategoria] = useState<Categoria | undefined>(undefined);

  const hoy = toIso(new Date());
  const carterasCubrir = carteras.filter((c) => c.activo && c.objetivo === "cubrir-presupuesto");
  const disponibleCubrirBs = carterasCubrir.reduce(
    (acc, c) => sum(acc, convertirAMoneyValues(c.saldo, c.moneda, hoy).bs),
    bs(0),
  );

  const disponibleFinal = preferencias.coberturaModo === "carteras-cubrir" ? resumenCarteras.disponibleBs : disponibleCubrirBs;

  const cobertura = useCobertura(presupuesto, transacciones, disponibleFinal);
  const periodoCerrado = usePeriodoCerrado(presupuesto);

  // `version` fuerza re-derivación cuando cualquier tabla de la DB cambia,
  // aunque el `presupuesto` no haya cambiado (ej: al agregar un detalle).
  const otrasCategoriasLimitesBs = useMemo(() => {
    if (!presupuesto || !detalleCategoria) return 0;
    return presupuesto.categorias
      .filter((c) => c.activo && c.id !== detalleCategoria.id)
      .reduce((acc, c) => acc + Number(convertirAMoneyValues(Number(c.limite), c.limiteMoneda, hoy).bs), 0);
  }, [presupuesto, detalleCategoria, hoy]);

  const detallesMap = useMemo(() => {
    if (!presupuesto) return {};
    const map: Record<string, CategoriaDetalle[]> = {};
    for (const cat of presupuesto.categorias) {
      map[cat.id] = listCategoriaDetalles(cat.id);
    }
    return map;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presupuesto, listCategoriaDetalles, version]);

  const detallesList = useMemo(
    () => detalleCategoria ? listCategoriaDetalles(detalleCategoria.id) : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [detalleCategoria, listCategoriaDetalles, version]
  );

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

  const handleOpenDetalles = useCallback((cat: Categoria) => {
    setDetalleCategoria(cat);
    setDetalleModalOpen(true);
  }, []);

  const handleAddDetalle = useCallback((data: Omit<CategoriaDetalle, "id" | "activo"> & { categoriaId: string }) => {
    addCategoriaDetalle(data);
    pushToast({ tone: "success", message: "Detalle creado" });
  }, [addCategoriaDetalle, pushToast]);

  const handleUpdateDetalle = useCallback((id: string, data: Partial<CategoriaDetalle>) => {
    updateCategoriaDetalle(id, data);
    pushToast({ tone: "success", message: "Detalle actualizado" });
  }, [updateCategoriaDetalle, pushToast]);

  const handleDeleteDetalle = useCallback((id: string) => {
    softDeleteCategoriaDetalle(id);
    pushToast({ tone: "success", message: "Detalle eliminado" });
  }, [softDeleteCategoriaDetalle, pushToast]);

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
            const inicio = toIso(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
            const fin = toIso(new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0));
            updatePresupuesto({
              nombre: "Presupuesto general",
              periodicidad: "mensual",
              ingresoEsperado: preferencias.moneda === "USD" ? usd(0) : bs(0),
              ingresoEsperadoMoneda: preferencias.moneda,
              gastoMaximoEsperado: preferencias.moneda === "USD" ? usd(0) : bs(0),
              gastoMaximoEsperadoMoneda: preferencias.moneda,
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
            detallesMap={detallesMap}
          />
        )}

        {tab === "Editar" && (
          <PresupuestoEditor
            presupuesto={presupuesto}
            onSave={handleSave}
            onAddCat={handleAddCat}
            onEditCat={handleEditCat}
            onDeleteCat={handleDeleteCat}
            onDetallesCat={handleOpenDetalles}
            detallesMap={detallesMap}
            monedaDefault={preferencias.moneda}
          />
        )}

      <CategoriaEditor
        open={modalOpen}
        cat={editingCat}
        presupuestoCats={presupuesto?.categorias ?? []}
        gastoMaximoEsperado={Number(presupuesto?.gastoMaximoEsperado ?? 0)}
        gastoMaximoEsperadoMoneda={presupuesto?.gastoMaximoEsperadoMoneda ?? "Bs"}
        monedaDefault={preferencias.moneda}
        onSave={handleSaveCat}
        onUpdatePresupuesto={(data) => updatePresupuesto({ ...data, gastoMaximoEsperado: bs(data.gastoMaximoEsperado) })}
        onClose={() => { setModalOpen(false); setEditingCat(undefined); }}
      />

      <CategoriaDetalleEditor
        open={detalleModalOpen}
        categoriaId={detalleCategoria?.id ?? ""}
        categoriaNombre={detalleCategoria?.nombre ?? ""}
        categoriaLimite={detalleCategoria?.limite ?? bs(0)}
        categoriaLimiteMoneda={detalleCategoria?.limiteMoneda ?? "Bs"}
        monedaDefault={preferencias.moneda}
        gastoMaximoEsperado={Number(presupuesto?.gastoMaximoEsperado ?? 0)}
        gastoMaximoEsperadoMoneda={presupuesto?.gastoMaximoEsperadoMoneda ?? "Bs"}
        otrasCategoriasLimitesBs={otrasCategoriasLimitesBs}
        detalles={detallesList}
        onAdd={handleAddDetalle}
        onUpdate={handleUpdateDetalle}
        onDelete={handleDeleteDetalle}
        onUpdateCategoria={(id, data) => updateCategoria(id, data)}
        onUpdatePresupuesto={(data) => updatePresupuesto({ ...data, gastoMaximoEsperado: data.gastoMaximoEsperadoMoneda === "USD" ? usd(data.gastoMaximoEsperado) : bs(data.gastoMaximoEsperado) })}
        onClose={() => { setDetalleModalOpen(false); setDetalleCategoria(undefined); }}
      />
      </div>
    </div>
  );
}

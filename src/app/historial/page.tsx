"use client";

import { useState } from "react";
import { useHistorial } from "@/hooks/useHistorial";
import { usePresupuesto } from "@/hooks/usePresupuesto";
import { useCarteras } from "@/hooks/useCarteras";
import { nukeIDB } from "@/lib/db/client";
import HistorialHeader from "@/components/historial/HistorialHeader";
import PeriodoSelector from "@/components/historial/PeriodoSelector";
import HistorialResumen from "@/components/historial/HistorialResumen";
import HistorialFilters from "@/components/historial/HistorialFilters";
import ActiveFilterChips from "@/components/historial/ActiveFilterChips";
import TransaccionList from "@/components/historial/TransaccionList";
import TransaccionDrawer from "@/components/historial/TransaccionDrawer";
import HistorialEmptyState from "@/components/historial/HistorialEmptyState";
import type { Transaccion } from "@/types/transaccion";

export default function HistorialPage() {
  const { presupuesto } = usePresupuesto();
  const { carteras } = useCarteras();
  const {
    filtradas,
    resumen,
    filtro,
    setPeriodo,
    setFiltroTipo,
    setFiltroCategoria,
    setFiltroCartera,
    limpiarFiltros,
    tieneFiltrosActivos,
  } = useHistorial(presupuesto);

  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [drawerTx, setDrawerTx] = useState<Transaccion | null>(null);

  const handleClearHistory = () => {
    if (confirm("¿Borrar toda la base de datos? La app se recargará.")) {
      nukeIDB();
    }
  };

  const rangoStr =
    filtro.periodo.tipo === "presupuesto" && presupuesto
      ? `${presupuesto.fechaInicio} — ${presupuesto.fechaFin}`
      : filtro.periodo.tipo === "rango"
        ? filtro.periodo.desde && filtro.periodo.hasta
          ? `${filtro.periodo.desde} — ${filtro.periodo.hasta}`
          : "Seleccione rango"
        : "Todo el historial";

  const periodoKey =
    filtro.periodo.tipo === "presupuesto"
      ? "presupuesto"
      : filtro.periodo.tipo === "rango"
        ? "rango"
        : "todas";

  return (
    <div className="flex flex-col min-h-screen">
      <HistorialHeader count={resumen.cantidad} rango={rangoStr} />

      <PeriodoSelector value={periodoKey} onChange={setPeriodo} />

      <HistorialResumen resumen={resumen} />

      <div className="flex items-center gap-2 px-4 py-2">
        <button
          onClick={() => setFilterSheetOpen(true)}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface-hover transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filtros
          {tieneFiltrosActivos && (
            <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-white">!</span>
          )}
        </button>
        <button
          onClick={handleClearHistory}
          className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-sm font-medium text-rose-500 hover:bg-rose-500/20 transition-colors"
        >
          Limpiar historial
        </button>
      </div>

      <ActiveFilterChips
        filtro={filtro}
        onRemoveTipo={() => setFiltroTipo("todos")}
        onRemoveCategoria={() => setFiltroCategoria("todos")}
        onRemoveCartera={() => setFiltroCartera("todos")}
      />

      {filtradas.length > 0 ? (
        <TransaccionList transacciones={filtradas} onTxClick={setDrawerTx} />
      ) : (
        <HistorialEmptyState conFiltros={tieneFiltrosActivos} onClearFilters={limpiarFiltros} />
      )}

      <HistorialFilters
        open={filterSheetOpen}
        filtro={filtro}
        presupuesto={presupuesto}
        carteras={carteras}
        onTipoChange={setFiltroTipo}
        onCategoriaChange={setFiltroCategoria}
        onCarteraChange={setFiltroCartera}
        onClose={() => setFilterSheetOpen(false)}
      />

      <TransaccionDrawer
        open={!!drawerTx}
        transaccion={drawerTx}
        onClose={() => setDrawerTx(null)}
      />
    </div>
  );
}

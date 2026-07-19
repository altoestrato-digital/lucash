"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useCarteras, getCarterasActivas } from "@/hooks/useCarteras";
import { useResumenCarteras } from "@/hooks/useResumenCarteras";
import { esLiquida } from "@/types/cartera";
import type { Cartera, CarteraId, CarteraInput, MetaCartera, MetaCarteraFormData } from "@/types/cartera";
import { useUIStore } from "@/stores/ui";
import { useConversion } from "@/hooks/useConversion";
import CarterasHeader from "@/components/carteras/CarterasHeader";
import CarterasTabs from "@/components/carteras/CarterasTabs";
import CarteraCard from "@/components/carteras/CarteraCard";
import CarterasEmptyState from "@/components/carteras/CarterasEmptyState";
import CarteraEditor from "@/components/carteras/CarteraEditor";
import CarteraDrawer from "@/components/carteras/CarteraDrawer";
import MetaEditor from "@/components/carteras/MetaEditor";
import ConversionModal from "@/components/carteras/ConversionModal";

export default function CarterasPage() {
  const {
    carteras, metas, movimientos,
    addCartera, updateCartera, softDeleteCartera,
    addMeta, updateMeta,
  } = useCarteras();

  const resumen = useResumenCarteras(carteras);
  const { convertir } = useConversion();
  const pushToast = useUIStore((s) => s.pushToast);

  const [tab, setTab] = useState("Todas");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingCartera, setEditingCartera] = useState<Cartera | undefined>();
  const [drawerCartera, setDrawerCartera] = useState<Cartera | undefined>();
  const [metaEditorOpen, setMetaEditorOpen] = useState(false);
  const [editingMeta, setEditingMeta] = useState<MetaCartera | undefined>();
  const [metaMoneda, setMetaMoneda] = useState("Bs");
  const [conversionOpen, setConversionOpen] = useState(false);

  const activas = getCarterasActivas(carteras);

  const filtered = activas.filter((c) => {
    if (tab === "Disponibles") return esLiquida(c);
    if (tab === "Ahorro") return c.objetivo === "ahorro";
    return true;
  });

  const liquidasActivas = activas.filter((c) => esLiquida(c) && c.id !== drawerCartera?.id);

  const handleSaveCartera = (data: CarteraInput) => {
    if (editingCartera) {
      updateCartera(editingCartera.id, data);
      pushToast({ tone: "success", message: "Cartera actualizada" });
    } else {
      addCartera(data);
      pushToast({ tone: "success", message: "Cartera creada" });
    }
    setEditorOpen(false);
    setEditingCartera(undefined);
  };

  const handleDeleteCartera = (id: CarteraId) => {
    if (window.confirm("¿Eliminar esta cartera?")) {
      softDeleteCartera(id);
    }
  };

  const handleSaveMeta = (data: MetaCarteraFormData) => {
    if (!drawerCartera) return;
    if (editingMeta) {
      updateMeta(editingMeta.id, data);
      pushToast({ tone: "success", message: "Meta actualizada" });
    } else {
      addMeta({ ...data, carteraId: drawerCartera.id });
      pushToast({ tone: "success", message: "Meta creada" });
    }
    setMetaEditorOpen(false);
    setEditingMeta(undefined);
  };

  const handleConversion = (data: { monto: number; carteraDestinoId: string; tasa: number }) => {
    if (!drawerCartera) return;
    const carteraDestino = liquidasActivas.find((c) => c.id === data.carteraDestinoId);
    if (!carteraDestino) return;
    convertir(drawerCartera, carteraDestino, data.monto, data.tasa);
    pushToast({ tone: "success", message: "Conversión realizada" });
    setConversionOpen(false);
  };

  return (
    <div className="flex flex-col pb-24">
      <CarterasHeader
        totalBs={resumen.totalBs}
        totalUsd={resumen.totalUsd}
        disponibleBs={resumen.disponibleBs}
        disponibleUsd={resumen.disponibleUsd}
        ahorroBs={resumen.ahorroBs}
        ahorroUsd={resumen.ahorroUsd}
      />
      <CarterasTabs active={tab} onChange={setTab} />

      {filtered.length === 0 ? (
        <CarterasEmptyState onCreate={() => { setEditingCartera(undefined); setEditorOpen(true); }} />
      ) : (
        <div className="flex flex-col lg:grid lg:grid-cols-2 lg:gap-4 lg:px-4">
          {filtered.map((c) => (
            <CarteraCard
              key={c.id}
              cartera={c}
              meta={metas.find((m) => m.carteraId === c.id)}
              onEdit={() => { setEditingCartera(c); setEditorOpen(true); }}
              onDelete={() => handleDeleteCartera(c.id)}
              onClick={() => setDrawerCartera(c)}
            />
          ))}
        </div>
      )}

      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 lg:bottom-8">
        <button
          onClick={() => { setEditingCartera(undefined); setEditorOpen(true); }}
          className="flex items-center gap-2 rounded-full gradient-primary px-6 py-3 text-sm font-medium text-white shadow-lg glow-primary hover:scale-105 active:scale-95 transition-all duration-200"
          aria-label="Nueva cartera"
        >
          <Plus className="h-5 w-5" />
          Nueva cartera
        </button>
      </div>

      <CarteraEditor
        key={editingCartera?.id ?? "nueva-cartera"}
        open={editorOpen}
        cartera={editingCartera}
        onSave={handleSaveCartera}
        onClose={() => { setEditorOpen(false); setEditingCartera(undefined); }}
      />

      <CarteraDrawer
        open={!!drawerCartera}
        cartera={drawerCartera!}
        metas={metas}
        movimientos={movimientos}
        onClose={() => setDrawerCartera(undefined)}
        onEdit={() => { setEditingCartera(drawerCartera); setEditorOpen(true); setDrawerCartera(undefined); }}
        onConvertir={() => setConversionOpen(true)}
        onEditMeta={(meta) => { setEditingMeta(meta); setMetaMoneda(drawerCartera?.moneda ?? "Bs"); setMetaEditorOpen(true); }}
        onAddMeta={() => { setEditingMeta(undefined); setMetaMoneda(drawerCartera?.moneda ?? "Bs"); setMetaEditorOpen(true); }}
        carteras={carteras}
      />

      <MetaEditor
        key="meta-editor"
        open={metaEditorOpen}
        meta={editingMeta}
        moneda={metaMoneda}
        onSave={handleSaveMeta}
        onClose={() => { setMetaEditorOpen(false); setEditingMeta(undefined); }}
      />

      <ConversionModal
        key="conversion-modal"
        open={conversionOpen}
        carteraOrigen={drawerCartera!}
        carterasDestino={liquidasActivas}
        onConfirm={handleConversion}
        onClose={() => setConversionOpen(false)}
      />
    </div>
  );
}

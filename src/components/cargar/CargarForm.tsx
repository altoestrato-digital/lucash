"use client";

import { useEffect } from "react";
import type { Presupuesto } from "@/types/presupuesto";
import type { Cartera } from "@/types/cartera";
import type { CargarFormState } from "@/hooks/useCargarForm";
import type { ISODateTime } from "@/lib/dates";
import { extractDate } from "@/lib/dates";
import { useDolarApiForDate } from "@/hooks/useDolarApiForDate";
import CategoriaSelect from "./CategoriaSelect";
import TasaBcvField from "./TasaBcvField";
import CarteraSelect from "./CarteraSelect";
import ReceiptThumbnail from "./ReceiptThumbnail";

interface Props {
  state: CargarFormState;
  presupuesto: Presupuesto | null;
  carteras: Cartera[];
  onUpdateField: <K extends keyof CargarFormState>(key: K, value: CargarFormState[K]) => void;
  onSave: () => void;
  onAnalizar: () => void;
  analizando: boolean;
}

export default function CargarForm({ state, presupuesto, carteras, onUpdateField, onSave, onAnalizar, analizando }: Props) {
  const descLen = state.descripcion.length;
  const isIngreso = state.tipo === "ingreso";
  const { activa } = useDolarApiForDate(extractDate(state.fecha));

  useEffect(() => {
    if (!activa || activa <= 0) return;

    if (state.lastEditedField === "montoBs") {
      const bsVal = parseFloat(state.montoBs);
      if (!isNaN(bsVal) && bsVal > 0) {
        const usdVal = (bsVal / activa).toFixed(2);
        if (usdVal !== state.montoUsd) {
          onUpdateField("montoUsd", usdVal);
        }
      } else if (state.montoBs === "") {
        onUpdateField("montoUsd", "");
      }
    } else if (state.lastEditedField === "montoUsd") {
      const usdVal = parseFloat(state.montoUsd);
      if (!isNaN(usdVal) && usdVal > 0) {
        const bsVal = (usdVal * activa).toFixed(2);
        if (bsVal !== state.montoBs) {
          onUpdateField("montoBs", bsVal);
        }
      } else if (state.montoUsd === "") {
        onUpdateField("montoBs", "");
      }
    }
  }, [state.montoBs, state.montoUsd, state.lastEditedField, activa, onUpdateField]);

  const inputClass = "w-full rounded-lg border border-border bg-surface-elevated px-3 py-2.5 text-sm text-foreground placeholder-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all";
  const labelClass = "text-sm font-medium text-foreground";

  return (
    <div className="flex flex-col gap-5 px-4 py-6 w-full max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-1">
        <span className={`text-2xl font-bold ${isIngreso ? "text-primary" : "text-danger"}`}>
          {isIngreso ? "+" : "−"}
        </span>
        <h1 className="text-lg font-semibold text-foreground">
          Nuevo {isIngreso ? "ingreso" : "egreso"}
        </h1>
      </div>

      {state.adjunto && (
        <div className="flex items-center gap-3">
          <ReceiptThumbnail adjunto={state.adjunto} />
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted">
              {state.adjunto.nombreArchivo}
            </span>
            <button
              onClick={onAnalizar}
              disabled={analizando}
              className="text-xs font-medium text-primary hover:underline disabled:opacity-40 disabled:no-underline"
            >
              {analizando ? "Analizando…" : "Analizar con OCR"}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <label className={labelClass}>
          {isIngreso ? "Emisor" : "Receptor"}
        </label>
        <input
          type="text"
          value={state.emisorReceptor}
          onChange={(e) => onUpdateField("emisorReceptor", e.target.value)}
          placeholder={isIngreso ? "¿Quién te pagó?" : "¿A quién le pagaste?"}
          className={inputClass}
        />
      </div>

      <div className="space-y-1.5">
        <label className={labelClass}>Concepto</label>
        <input
          type="text"
          value={state.concepto}
          onChange={(e) => onUpdateField("concepto", e.target.value)}
          placeholder="Ej: Pago de nomina, Supermercado"
          className={inputClass}
        />
      </div>

      {!isIngreso && (
        <div className="space-y-1.5">
          <label className={labelClass}>Categoria</label>
          <CategoriaSelect
            value={state.categoriaId}
            presupuesto={presupuesto}
            onChange={(id) => onUpdateField("categoriaId", id)}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className={labelClass}>Monto en Bs</label>
          <input
            type="text"
            inputMode="decimal"
            value={state.montoBs}
            onChange={(e) => {
              onUpdateField("montoBs", e.target.value);
              onUpdateField("lastEditedField", "montoBs");
            }}
            placeholder="0.00"
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <label className={labelClass}>Monto en USD</label>
          <input
            type="text"
            inputMode="decimal"
            value={state.montoUsd}
            onChange={(e) => {
              onUpdateField("montoUsd", e.target.value);
              onUpdateField("lastEditedField", "montoUsd");
            }}
            placeholder="0.00"
            className={inputClass}
          />
        </div>
      </div>

      <TasaBcvField
        fecha={state.fecha}
        value={state.tasaBcv}
        onChange={(v) => onUpdateField("tasaBcv", v)}
      />

      <div className="space-y-1.5">
        <label className={labelClass}>
          Descripción
          <span className="ml-1 text-xs text-muted">({descLen}/240)</span>
        </label>
        <textarea
          value={state.descripcion}
          onChange={(e) => {
            if (e.target.value.length <= 240) onUpdateField("descripcion", e.target.value);
          }}
          rows={3}
          placeholder="Notas adicionales…"
          className={`${inputClass} resize-none`}
        />
        <div className="flex justify-end">
          <span className={`text-xs ${descLen >= 240 ? "text-danger" : "text-muted"}`}>
            {descLen}/240
          </span>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className={labelClass}>Cartera</label>
        <CarteraSelect
          value={state.carteraId}
          carteras={carteras}
          onChange={(id) => onUpdateField("carteraId", id)}
        />
      </div>

      <div className="space-y-1.5">
        <label className={labelClass}>Fecha</label>
        <input
          type="datetime-local"
          value={state.fecha}
          onChange={(e) => onUpdateField("fecha", e.target.value as ISODateTime)}
          className={inputClass}
        />
      </div>

      <div className="sticky bottom-4 pt-2 pb-4">
        <button
          onClick={onSave}
          className="w-full rounded-xl gradient-primary px-4 py-3 text-sm font-semibold text-white shadow-lg glow-primary hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Guardar {isIngreso ? "ingreso" : "egreso"}
        </button>
      </div>
    </div>
  );
}

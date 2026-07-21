"use client";

import type { Presupuesto } from "@/types/presupuesto";
import type { Cartera } from "@/types/cartera";
import type { CargarFormState } from "@/hooks/useCargarForm";
import type { ISODateTime } from "@/lib/dates";
import { extractDate } from "@/lib/dates";
import { useDolarApiForDate } from "@/hooks/useDolarApiForDate";
import { Field, TextInput, Textarea } from "@/components/ui/Field";
import Button from "@/components/ui/Button";
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

  const tasaManual = parseFloat(state.tasaBcv);
  const tasaParaCalculo = !isNaN(tasaManual) && tasaManual > 0
    ? tasaManual
    : (activa ?? 0);

  const handleMontoBsChange = (raw: string) => {
    onUpdateField("montoBs", raw);
    onUpdateField("lastEditedField", "montoBs");
    if (!tasaParaCalculo || tasaParaCalculo <= 0) return;
    const bsVal = parseFloat(raw);
    if (raw === "" || isNaN(bsVal) || bsVal <= 0) {
      onUpdateField("montoUsd", "");
      return;
    }
    const usdVal = (bsVal / tasaParaCalculo).toFixed(2);
    onUpdateField("montoUsd", usdVal);
  };

  const handleMontoUsdChange = (raw: string) => {
    onUpdateField("montoUsd", raw);
    onUpdateField("lastEditedField", "montoUsd");
    if (!tasaParaCalculo || tasaParaCalculo <= 0) return;
    const usdVal = parseFloat(raw);
    if (raw === "" || isNaN(usdVal) || usdVal <= 0) {
      onUpdateField("montoBs", "");
      return;
    }
    const bsVal = (usdVal * tasaParaCalculo).toFixed(2);
    onUpdateField("montoBs", bsVal);
  };

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

      <Field label={isIngreso ? "Emisor" : "Receptor"}>
        <TextInput
          value={state.emisorReceptor}
          onChange={(e) => onUpdateField("emisorReceptor", e.target.value)}
          placeholder={isIngreso ? "¿Quién te pagó?" : "¿A quién le pagaste?"}
        />
      </Field>

      <Field label="Concepto">
        <TextInput
          value={state.concepto}
          onChange={(e) => onUpdateField("concepto", e.target.value)}
          placeholder="Ej: Pago de nomina, Supermercado"
        />
      </Field>

      {!isIngreso && (
        <Field label="Categoria">
          <CategoriaSelect
            value={state.categoriaId}
            presupuesto={presupuesto}
            onChange={(id) => onUpdateField("categoriaId", id)}
          />
        </Field>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Monto en Bs">
          <TextInput
            inputMode="decimal"
            value={state.montoBs}
            onChange={(e) => handleMontoBsChange(e.target.value)}
            placeholder="0.00"
          />
        </Field>
        <Field label="Monto en USD">
          <TextInput
            inputMode="decimal"
            value={state.montoUsd}
            onChange={(e) => handleMontoUsdChange(e.target.value)}
            placeholder="0.00"
          />
        </Field>
      </div>

      <TasaBcvField
        fecha={state.fecha}
        value={state.tasaBcv}
        onChange={(v) => onUpdateField("tasaBcv", v)}
      />

      <Field
        label={
          <span>
            Descripción
            <span className="ml-1 text-xs text-muted">({descLen}/240)</span>
          </span>
        }
        hint={`${descLen}/240`}
        error={descLen >= 240 ? "Máximo 240 caracteres" : undefined}
      >
        <Textarea
          value={state.descripcion}
          onChange={(e) => {
            if (e.target.value.length <= 240) onUpdateField("descripcion", e.target.value);
          }}
          rows={3}
          placeholder="Notas adicionales…"
        />
      </Field>

      <Field label="Cartera">
        <CarteraSelect
          value={state.carteraId}
          carteras={carteras}
          onChange={(id) => onUpdateField("carteraId", id)}
        />
      </Field>

      <Field label="Fecha">
        <TextInput
          type="datetime-local"
          value={state.fecha}
          onChange={(e) => onUpdateField("fecha", e.target.value as ISODateTime)}
        />
      </Field>

      <div className="sticky bottom-4 pt-2 pb-4">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={onSave}
          className="shadow-lg glow-primary"
        >
          Guardar {isIngreso ? "ingreso" : "egreso"}
        </Button>
      </div>
    </div>
  );
}

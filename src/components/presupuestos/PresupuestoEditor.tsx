"use client";

import { useState } from "react";
import type { Presupuesto, Categoria, CategoriaDetalle, Periodicidad, MonedaBudget } from "@/types/presupuesto";
import type { ISODate } from "@/lib/dates";
import { bs } from "@/lib/money";
import { toIso } from "@/lib/dates";
import { usePreferencias } from "@/hooks/usePreferencias";
import PeriodicidadSelect from "./PeriodicidadSelect";
import CategoriaRow from "./CategoriaRow";
import MoneyInput from "./MoneyInput";
import Switch from "@/components/ui/Switch";

const defaultRangoFechas = (): { inicio: ISODate; fin: ISODate } => {
  const hoy = new Date();
  const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
  return { inicio: toIso(hoy), fin: toIso(finMes) };
};

export default function PresupuestoEditor({
  presupuesto,
  onSave,
  onAddCat,
  onEditCat,
  onDeleteCat,
  onDetallesCat,
  detallesMap,
}: {
  presupuesto: Presupuesto;
  onSave: (data: Partial<Presupuesto>) => void;
  onAddCat: () => void;
  onEditCat: (cat: Categoria) => void;
  onDeleteCat: (id: string) => void;
  onDetallesCat: (cat: Categoria) => void;
  detallesMap?: Record<string, CategoriaDetalle[]>;
}) {
  const { preferencias } = usePreferencias();
  const [ingreso, setIngreso] = useState(String(Number(presupuesto.ingresoEsperado)));
  const [ingresoMoneda, setIngresoMoneda] = useState<MonedaBudget>(presupuesto.ingresoEsperadoMoneda || preferencias.moneda);
  const [gastoMaximo, setGastoMaximo] = useState(String(Number(presupuesto.gastoMaximoEsperado)));
  const [gastoMaximoMoneda, setGastoMaximoMoneda] = useState<MonedaBudget>(presupuesto.gastoMaximoEsperadoMoneda || preferencias.moneda);
  const [periodicidad, setPeriodicidad] = useState<Periodicidad>(presupuesto.periodicidad);
  const [corteDia, setCorteDia] = useState<1 | 16>(presupuesto.quincenaCorteDia ?? 1);
  const [fechaInicio, setFechaInicio] = useState<ISODate>(presupuesto.fechaInicio);
  const [fechaFin, setFechaFin] = useState<ISODate>(presupuesto.fechaFin);
  const [persistente, setPersistente] = useState(presupuesto.persistente ?? false);
  const [dirty, setDirty] = useState(false);

  const activos = presupuesto.categorias.filter((s) => s.activo);

  const handlePeriodicidadChange = (p: Periodicidad) => {
    setPeriodicidad(p);
    setDirty(true);
    if (p === "rango") {
      const { inicio, fin } = defaultRangoFechas();
      setFechaInicio(inicio);
      setFechaFin(fin);
    }
  };

  const handleSave = () => {
    onSave({
      ingresoEsperado: bs(Number(ingreso)),
      ingresoEsperadoMoneda: ingresoMoneda,
      gastoMaximoEsperado: bs(Number(gastoMaximo)),
      gastoMaximoEsperadoMoneda: gastoMaximoMoneda,
      periodicidad,
      quincenaCorteDia: periodicidad === "quincenal" ? corteDia : undefined,
      fechaInicio,
      fechaFin,
      persistente: periodicidad === "rango" ? persistente : undefined,
    });
    setDirty(false);
  };

  const hasChanges =
    Number(ingreso) !== Number(presupuesto.ingresoEsperado) ||
    ingresoMoneda !== presupuesto.ingresoEsperadoMoneda ||
    Number(gastoMaximo) !== Number(presupuesto.gastoMaximoEsperado) ||
    gastoMaximoMoneda !== presupuesto.gastoMaximoEsperadoMoneda ||
    periodicidad !== presupuesto.periodicidad ||
    (periodicidad === "quincenal" && corteDia !== presupuesto.quincenaCorteDia) ||
    fechaInicio !== presupuesto.fechaInicio ||
    fechaFin !== presupuesto.fechaFin ||
    (periodicidad === "rango" && persistente !== (presupuesto.persistente ?? false));

  return (
    <div className="space-y-6 pb-24">
      <div className="rounded-2xl bg-surface border border-border p-4 space-y-4">
        <MoneyInput
          label="Ingreso esperado"
          value={ingreso}
          onChange={(v) => { setIngreso(v); setDirty(true); }}
          moneda={ingresoMoneda}
          onMonedaChange={(m) => { setIngresoMoneda(m); setDirty(true); }}
          prioritizeMoneda={preferencias.moneda}
        />

        <MoneyInput
          label="Gasto maximo esperado"
          value={gastoMaximo}
          onChange={(v) => { setGastoMaximo(v); setDirty(true); }}
          moneda={gastoMaximoMoneda}
          onMonedaChange={(m) => { setGastoMaximoMoneda(m); setDirty(true); }}
          prioritizeMoneda={preferencias.moneda}
        />

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Periodicidad</label>
          <PeriodicidadSelect
            value={periodicidad}
            quincenaCorteDia={corteDia}
            fechaInicio={fechaInicio}
            fechaFin={fechaFin}
            onChange={handlePeriodicidadChange}
            onChangeCorte={(d) => { setCorteDia(d); setDirty(true); }}
            onChangeFechaInicio={(f) => { setFechaInicio(f); setDirty(true); }}
            onChangeFechaFin={(f) => { setFechaFin(f); setDirty(true); }}
          />
        </div>

        {periodicidad === "rango" && (
          <div className="rounded-lg border border-border px-3 py-2.5">
            <Switch
              checked={persistente}
              onChange={(v) => { setPersistente(v); setDirty(true); }}
              label="Persistente"
              description="Al cerrar el período, crea automáticamente el siguiente con la misma duración."
            />
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={!hasChanges && !dirty}
          className={`w-full font-medium rounded-xl py-2.5 text-sm transition-all duration-200 mt-2 ${
            hasChanges || dirty
              ? "gradient-primary text-white shadow-lg glow-primary hover:scale-[1.01] active:scale-[0.98]"
              : "bg-surface-elevated text-muted border border-border cursor-not-allowed"
          }`}
        >
          Guardar cambios
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted uppercase tracking-wide">Categorias</h3>
          <button
            onClick={onAddCat}
            className="text-sm font-medium text-primary hover:text-primary-dark transition-colors"
          >
            + Nueva categoria
          </button>
        </div>
        {activos
          .sort((a, b) => a.prioridad - b.prioridad || a.orden - b.orden)
          .map((cat) => (
            <CategoriaRow
              key={cat.id}
              cat={cat}
              detalles={detallesMap?.[cat.id]}
              onEdit={() => onEditCat(cat)}
              onDelete={() => onDeleteCat(cat.id)}
              onDetalles={() => onDetallesCat(cat)}
            />
          ))}
        {activos.length === 0 && (
          <p className="text-sm text-muted text-center py-4">
            No hay categorias. Crea una nueva.
          </p>
        )}
      </div>
    </div>
  );
}

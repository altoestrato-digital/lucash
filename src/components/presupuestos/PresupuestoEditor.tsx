"use client";

import { useState } from "react";
import type { Presupuesto, Categoria, Periodicidad, MonedaBudget } from "@/types/presupuesto";
import { bs } from "@/lib/money";
import { convertirAUSD, convertirABs } from "@/lib/conversion";
import { toIso } from "@/lib/dates";
import PeriodicidadSelect from "./PeriodicidadSelect";
import CategoriaRow from "./CategoriaRow";

export default function PresupuestoEditor({
  presupuesto,
  onSave,
  onAddCat,
  onEditCat,
  onDeleteCat,
}: {
  presupuesto: Presupuesto;
  onSave: (data: Partial<Presupuesto>) => void;
  onAddCat: () => void;
  onEditCat: (cat: Categoria) => void;
  onDeleteCat: (id: string) => void;
}) {
  const hoy = toIso(new Date());

  const [ingreso, setIngreso] = useState(String(Number(presupuesto.ingresoEsperado)));
  const [ingresoMoneda, setIngresoMoneda] = useState<MonedaBudget>(presupuesto.ingresoEsperadoMoneda);
  const [gastoMaximo, setGastoMaximo] = useState(String(Number(presupuesto.gastoMaximoEsperado)));
  const [gastoMaximoMoneda, setGastoMaximoMoneda] = useState<MonedaBudget>(presupuesto.gastoMaximoEsperadoMoneda);
  const [periodicidad, setPeriodicidad] = useState<Periodicidad>(presupuesto.periodicidad);
  const [corteDia, setCorteDia] = useState<1 | 16>(presupuesto.quincenaCorteDia ?? 1);
  const [dirty, setDirty] = useState(false);

  const activos = presupuesto.categorias.filter((s) => s.activo);

  const getEquivalentBs = (value: string, moneda: MonedaBudget): string => {
    const num = Number(value);
    if (isNaN(num) || num === 0) return "";
    if (moneda === "Bs") {
      const usdEq = Number(convertirAUSD(num, "Bs", hoy));
      return usdEq > 0 ? `≈ USD ${usdEq.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "";
    } else {
      const bsEq = Number(convertirABs(bs(num), hoy));
      return bsEq > 0 ? `≈ Bs ${bsEq.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "";
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
    });
    setDirty(false);
  };

  const hasChanges =
    Number(ingreso) !== Number(presupuesto.ingresoEsperado) ||
    ingresoMoneda !== presupuesto.ingresoEsperadoMoneda ||
    Number(gastoMaximo) !== Number(presupuesto.gastoMaximoEsperado) ||
    gastoMaximoMoneda !== presupuesto.gastoMaximoEsperadoMoneda ||
    periodicidad !== presupuesto.periodicidad ||
    (periodicidad === "quincenal" && corteDia !== presupuesto.quincenaCorteDia);

  const inputClass = "w-full rounded-xl border border-border bg-surface-elevated px-3 py-2.5 text-sm text-foreground placeholder-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all";
  const selectClass = "rounded-xl border border-border bg-surface-elevated px-2 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all";

  return (
    <div className="space-y-6 pb-24">
      <div className="rounded-2xl bg-surface border border-border p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Ingreso esperado</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="number"
                value={ingreso}
                onChange={(e) => { setIngreso(e.target.value); setDirty(true); }}
                min={0}
                step="0.01"
                className={inputClass}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted pointer-events-none">
                {ingresoMoneda === "USD" ? "USD" : "Bs"}
              </span>
            </div>
            <select
              value={ingresoMoneda}
              onChange={(e) => { setIngresoMoneda(e.target.value as MonedaBudget); setDirty(true); }}
              className={selectClass}
            >
              <option value="Bs">Bs</option>
              <option value="USD">USD</option>
            </select>
          </div>
          {ingreso && Number(ingreso) > 0 && (
            <p className="mt-1 text-xs text-muted">{getEquivalentBs(ingreso, ingresoMoneda)}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Gasto maximo esperado</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="number"
                value={gastoMaximo}
                onChange={(e) => { setGastoMaximo(e.target.value); setDirty(true); }}
                min={0}
                step="0.01"
                className={inputClass}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted pointer-events-none">
                {gastoMaximoMoneda === "USD" ? "USD" : "Bs"}
              </span>
            </div>
            <select
              value={gastoMaximoMoneda}
              onChange={(e) => { setGastoMaximoMoneda(e.target.value as MonedaBudget); setDirty(true); }}
              className={selectClass}
            >
              <option value="Bs">Bs</option>
              <option value="USD">USD</option>
            </select>
          </div>
          {gastoMaximo && Number(gastoMaximo) > 0 && (
            <p className="mt-1 text-xs text-muted">{getEquivalentBs(gastoMaximo, gastoMaximoMoneda)}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Periodicidad</label>
          <PeriodicidadSelect
            value={periodicidad}
            quincenaCorteDia={corteDia}
            onChange={(p) => { setPeriodicidad(p); setDirty(true); }}
            onChangeCorte={(d) => { setCorteDia(d); setDirty(true); }}
          />
        </div>

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
              onEdit={() => onEditCat(cat)}
              onDelete={() => onDeleteCat(cat.id)}
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

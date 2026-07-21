"use client";

import { useState } from "react";
import type { Categoria, MonedaBudget } from "@/types/presupuesto";
import type { HexColor } from "@/types/hex-color";
import { bs } from "@/lib/money";
import { convertirAUSD, convertirABs } from "@/lib/conversion";
import { toIso } from "@/lib/dates";
import ColorPicker from "./ColorPicker";
import PrioridadControl from "./PrioridadControl";

type CategoriaDraft = Omit<Categoria, "id" | "activo" | "presupuestoId">;

const toBs = (monto: number, moneda: MonedaBudget): number => {
  if (moneda === "Bs") return monto;
  const hoy = toIso(new Date());
  const usdValue = convertirAUSD(monto, "USD", hoy);
  return Number(convertirABs(usdValue, hoy));
};

export default function CategoriaEditor({
  open,
  cat,
  presupuestoCats,
  gastoMaximoEsperado,
  gastoMaximoEsperadoMoneda,
  onSave,
  onUpdatePresupuesto,
  onClose,
}: {
  open: boolean;
  cat?: Categoria;
  presupuestoCats: Categoria[];
  gastoMaximoEsperado: number;
  gastoMaximoEsperadoMoneda: MonedaBudget;
  onSave: (data: CategoriaDraft) => void;
  onUpdatePresupuesto?: (data: { gastoMaximoEsperado: number; gastoMaximoEsperadoMoneda: MonedaBudget }) => void;
  onClose: () => void;
}) {
  return open ? (
    <CategoriaEditorInner
      key={cat?.id ?? "new"}
      cat={cat}
      presupuestoCats={presupuestoCats}
      gastoMaximoEsperado={gastoMaximoEsperado}
      gastoMaximoEsperadoMoneda={gastoMaximoEsperadoMoneda}
      onSave={onSave}
      onUpdatePresupuesto={onUpdatePresupuesto}
      onClose={onClose}
    />
  ) : null;
}

function CategoriaEditorInner({
  cat,
  presupuestoCats,
  gastoMaximoEsperado,
  gastoMaximoEsperadoMoneda,
  onSave,
  onUpdatePresupuesto,
  onClose,
}: {
  cat?: Categoria;
  presupuestoCats: Categoria[];
  gastoMaximoEsperado: number;
  gastoMaximoEsperadoMoneda: MonedaBudget;
  onSave: (data: CategoriaDraft) => void;
  onUpdatePresupuesto?: (data: { gastoMaximoEsperado: number; gastoMaximoEsperadoMoneda: MonedaBudget }) => void;
  onClose: () => void;
}) {
  const [nombre, setNombre] = useState(cat?.nombre ?? "");
  const [color, setColor] = useState(cat?.color ?? "#3B82F6");
  const [limite, setLimite] = useState(cat ? String(Number(cat.limite)) : "");
  const [limiteMoneda, setLimiteMoneda] = useState<MonedaBudget>(cat?.limiteMoneda ?? "Bs");
  const [prioridad, setPrioridad] = useState<1 | 2 | 3>(cat?.prioridad ?? 2);
  const [recurrente, setRecurrente] = useState(cat?.recurrente ?? true);

  const nextOrden = (p: 1 | 2 | 3): number => {
    const maxOrden = presupuestoCats
      .filter((s) => s.activo && s.prioridad === p)
      .reduce((max, s) => Math.max(max, s.orden), 0);
    return maxOrden + 1;
  };

  const defaultOrden = cat ? cat.orden : nextOrden(prioridad);
  const [orden, setOrden] = useState(String(defaultOrden));

  const handlePrioridadChange = (p: 1 | 2 | 3) => {
    setPrioridad(p);
    if (!cat) {
      setOrden(String(nextOrden(p)));
    }
  };

  const gastoMaximoBs = toBs(gastoMaximoEsperado, gastoMaximoEsperadoMoneda);
  const otrosCatsTotalBs = presupuestoCats
    .filter((s) => s.activo && s.id !== cat?.id)
    .reduce((acc, s) => acc + toBs(Number(s.limite), s.limiteMoneda), 0);
  const esteLimiteBs = limite ? toBs(Number(limite), limiteMoneda) : 0;
  const totalConEsteBs = otrosCatsTotalBs + esteLimiteBs;
  const excedeMaximo = gastoMaximoBs > 0 && totalConEsteBs > gastoMaximoBs;

  const getEquivalent = (value: string, moneda: MonedaBudget): string => {
    const num = Number(value);
    if (isNaN(num) || num === 0) return "";
    if (moneda === "Bs") {
      const usdEq = Number(convertirAUSD(num, "Bs", toIso(new Date())));
      return usdEq > 0 ? `≈ USD ${usdEq.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "";
    } else {
      const bsEq = toBs(num, "USD");
      return bsEq > 0 ? `≈ Bs ${bsEq.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !limite) return;
    if (excedeMaximo && onUpdatePresupuesto) {
      onUpdatePresupuesto({
        gastoMaximoEsperado: bs(totalConEsteBs),
        gastoMaximoEsperadoMoneda: "Bs",
      });
    }
    onSave({
      nombre: nombre.trim(),
      color: color as HexColor,
      limite: bs(Number(limite)),
      limiteMoneda,
      prioridad,
      recurrente,
      orden: Number(orden),
    });
  };

  const formatBs = (v: number) => v.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formatUSD = (v: number) => v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white dark:bg-zinc-900 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 space-y-5 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {cat ? "Editar categoría" : "Nueva categoría"}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700">
            <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              placeholder="Ej: Comida"
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Color</label>
            <ColorPicker value={color} onChange={setColor} />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Limite</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  value={limite}
                  onChange={(e) => setLimite(e.target.value)}
                  required
                  min={0}
                  step="0.01"
                  placeholder="0.00"
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400 pointer-events-none">
                  {limiteMoneda === "USD" ? "USD" : "Bs"}
                </span>
              </div>
              <select
                value={limiteMoneda}
                onChange={(e) => setLimiteMoneda(e.target.value as MonedaBudget)}
                className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400"
              >
                <option value="Bs">Bs</option>
                <option value="USD">USD</option>
              </select>
            </div>
            {limite && Number(limite) > 0 && (
              <p className="mt-1 text-xs text-zinc-500">{getEquivalent(limite, limiteMoneda)}</p>
            )}
            {excedeMaximo ? (
              <div className="mt-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 dark:bg-amber-950/40 dark:border-amber-800">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Total de categorías: {gastoMaximoEsperadoMoneda === "USD" ? `USD ${formatUSD(totalConEsteBs / (gastoMaximoBs / gastoMaximoEsperado))}` : `Bs ${formatBs(totalConEsteBs)}`}. Excede el gasto máximo (Bs {formatBs(gastoMaximoBs)}) por Bs {formatBs(totalConEsteBs - gastoMaximoBs)}.
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  Al guardar, el gasto máximo se actualizará automáticamente.
                </p>
              </div>
            ) : (
              <p className="mt-1.5 text-xs text-zinc-500 flex items-center gap-1">
                <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Excede el gasto maximo esperado
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Prioridad</label>
            <PrioridadControl value={prioridad} onChange={handlePrioridadChange} />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Recurrente</label>
            <button
              type="button"
              role="switch"
              aria-checked={recurrente}
              onClick={() => setRecurrente((r) => !r)}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                recurrente ? "bg-zinc-900 dark:bg-zinc-100" : "bg-zinc-300 dark:bg-zinc-600"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white dark:bg-zinc-900 transition-transform ${
                  recurrente ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Orden</label>
            <input
              type="number"
              value={orden}
              onChange={(e) => setOrden(e.target.value)}
              min={1}
              className="w-20 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
          </div>

          <button
            type="submit"
            className={`w-full font-medium rounded-lg py-2.5 text-sm transition-colors ${
              excedeMaximo
                ? "bg-amber-500 hover:bg-amber-600 text-white dark:bg-amber-600 dark:hover:bg-amber-700"
                : "bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900"
            }`}
          >
            {excedeMaximo ? "Guardar y actualizar gasto máximo" : (cat ? "Guardar cambios" : "Crear categoría")}
          </button>
        </form>
      </div>
    </div>
  );
}

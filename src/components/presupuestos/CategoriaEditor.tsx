"use client";

import { useState } from "react";
import type { Categoria, MonedaBudget } from "@/types/presupuesto";
import type { HexColor } from "@/types/hex-color";
import { bs, usd } from "@/lib/money";
import { toBs } from "@/lib/conversion";
import { toIso } from "@/lib/dates";
import { X } from "lucide-react";
import ColorPicker from "./ColorPicker";
import PrioridadControl from "./PrioridadControl";
import MoneyInput from "./MoneyInput";
import Switch from "@/components/ui/Switch";

type CategoriaDraft = Omit<Categoria, "id" | "activo" | "presupuestoId">;

type CategoriaEditorFormProps = {
  cat?: Categoria;
  presupuestoCats: Categoria[];
  gastoMaximoEsperado: number;
  gastoMaximoEsperadoMoneda: MonedaBudget;
  monedaDefault: MonedaBudget;
  onSave: (data: CategoriaDraft) => void;
  onUpdatePresupuesto?: (data: { gastoMaximoEsperado: number; gastoMaximoEsperadoMoneda: MonedaBudget }) => void;
  onClose: () => void;
};

export default function CategoriaEditor({
  open,
  cat,
  presupuestoCats,
  gastoMaximoEsperado,
  gastoMaximoEsperadoMoneda,
  monedaDefault,
  onSave,
  onUpdatePresupuesto,
  onClose,
}: CategoriaEditorFormProps & { open: boolean }) {
  return open ? (
    <CategoriaEditorForm
      key={cat?.id ?? "new"}
      cat={cat}
      presupuestoCats={presupuestoCats}
      gastoMaximoEsperado={gastoMaximoEsperado}
      gastoMaximoEsperadoMoneda={gastoMaximoEsperadoMoneda}
      monedaDefault={monedaDefault}
      onSave={onSave}
      onUpdatePresupuesto={onUpdatePresupuesto}
      onClose={onClose}
    />
  ) : null;
}

function CategoriaEditorForm({
  cat,
  presupuestoCats,
  gastoMaximoEsperado,
  gastoMaximoEsperadoMoneda,
  monedaDefault,
  onSave,
  onUpdatePresupuesto,
  onClose,
}: CategoriaEditorFormProps) {
  const [nombre, setNombre] = useState(cat?.nombre ?? "");
  const [color, setColor] = useState<HexColor>((cat?.color ?? "#3B82F6") as HexColor);
  const [limite, setLimite] = useState(cat ? String(Number(cat.limite)) : "");
  const [limiteMoneda, setLimiteMoneda] = useState<MonedaBudget>(cat?.limiteMoneda ?? monedaDefault);
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

  const hoy = toIso(new Date());
  const gastoMaximoBs = toBs(gastoMaximoEsperado, gastoMaximoEsperadoMoneda, hoy);
  const otrosCatsTotalBs = presupuestoCats
    .filter((s) => s.activo && s.id !== cat?.id)
    .reduce((acc, s) => acc + toBs(Number(s.limite), s.limiteMoneda, hoy), 0);
  const esteLimiteBs = limite ? toBs(Number(limite), limiteMoneda, hoy) : 0;
  const totalConEsteBs = otrosCatsTotalBs + esteLimiteBs;
  const excedeMaximo = gastoMaximoBs > 0 && totalConEsteBs > gastoMaximoBs;
  const excedenteBs = totalConEsteBs - gastoMaximoBs;

  const totalConEsteMoneda = gastoMaximoEsperadoMoneda === "USD"
    ? Number(toBs(totalConEsteBs, "Bs", hoy) / toBs(1, "USD", hoy))
    : totalConEsteBs;
  const excedenteMoneda = gastoMaximoEsperadoMoneda === "USD"
    ? Number(toBs(excedenteBs, "Bs", hoy) / toBs(1, "USD", hoy))
    : excedenteBs;

  const formatNum = (v: number, locale: "es-VE" | "en-US") =>
    v.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const monedaLabel = (m: "Bs" | "USD") => m === "USD" ? "USD" : "Bs";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !limite) return;
    if (excedeMaximo && onUpdatePresupuesto) {
      onUpdatePresupuesto({
        gastoMaximoEsperado: gastoMaximoEsperadoMoneda === "USD" ? usd(totalConEsteMoneda) : bs(totalConEsteBs),
        gastoMaximoEsperadoMoneda,
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
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700" aria-label="Cerrar">
            <X className="w-5 h-5 text-zinc-500" />
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

          <MoneyInput
            label="Limite"
            value={limite}
            onChange={setLimite}
            moneda={limiteMoneda}
            onMonedaChange={setLimiteMoneda}
            showEquivalent={false}
            prioritizeMoneda={monedaDefault}
          />

          {excedeMaximo && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 dark:bg-amber-950/40 dark:border-amber-800">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Total de categorías: {monedaLabel(gastoMaximoEsperadoMoneda)} {formatNum(gastoMaximoEsperadoMoneda === "USD" ? totalConEsteMoneda : totalConEsteBs, gastoMaximoEsperadoMoneda === "USD" ? "en-US" : "es-VE")}. Excede el gasto máximo ({monedaLabel(gastoMaximoEsperadoMoneda)} {formatNum(gastoMaximoEsperadoMoneda === "USD" ? gastoMaximoEsperado : gastoMaximoBs, gastoMaximoEsperadoMoneda === "USD" ? "en-US" : "es-VE")}) por {monedaLabel(gastoMaximoEsperadoMoneda)} {formatNum(gastoMaximoEsperadoMoneda === "USD" ? excedenteMoneda : excedenteBs, gastoMaximoEsperadoMoneda === "USD" ? "en-US" : "es-VE")}.
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                Al guardar, el gasto máximo se actualizará automáticamente.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Prioridad</label>
            <PrioridadControl value={prioridad} onChange={handlePrioridadChange} />
          </div>

          <Switch
            checked={recurrente}
            onChange={setRecurrente}
            label="Recurrente"
            className="py-1"
          />

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

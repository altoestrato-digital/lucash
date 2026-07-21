"use client";

import { useState } from "react";
import type { CategoriaDetalle, Categoria, MonedaBudget } from "@/types/presupuesto";
import type { HexColor } from "@/types/hex-color";
import { bs, usd, type Money } from "@/lib/money";
import { useMonedaActiva } from "@/hooks/useMonedaActiva";
import { convertirAMoneyValues } from "@/lib/conversion";
import { toIso } from "@/lib/dates";
import type { CategoriaId } from "@/types/transaccion";
import ColorPicker from "./ColorPicker";

interface CategoriaDetalleEditorProps {
  open: boolean;
  categoriaId: string;
  categoriaNombre: string;
  categoriaLimite: Money;
  categoriaLimiteMoneda: MonedaBudget;
  detalles: CategoriaDetalle[];
  onAdd: (data: Omit<CategoriaDetalle, "id" | "activo"> & { categoriaId: string }) => void;
  onUpdate: (id: string, data: Partial<CategoriaDetalle>) => void;
  onDelete: (id: string) => void;
  onUpdateCategoria?: (id: string, data: Partial<Categoria>) => void;
  onClose: () => void;
}

export default function CategoriaDetalleEditor({
  open,
  categoriaId,
  categoriaNombre,
  categoriaLimite,
  categoriaLimiteMoneda,
  detalles,
  onAdd,
  onUpdate,
  onDelete,
  onUpdateCategoria,
  onClose,
}: CategoriaDetalleEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [montoInput, setMontoInput] = useState("");
  const [moneda, setMoneda] = useState<MonedaBudget>("Bs");
  const [color, setColor] = useState("#3B82F6");
  const [orden, setOrden] = useState("1");

  const { fromCartera } = useMonedaActiva();
  const hoy = toIso(new Date());

  const resetForm = () => {
    setEditingId(null);
    setNombre("");
    setMontoInput("");
    setMoneda("Bs");
    setColor("#3B82F6");
    setOrden(String(detalles.length + 1));
  };

  const calcTotalDetallesBs = (montoNuevo: number, monedaNueva: MonedaBudget, excludeId?: string): Money => {
    let total = 0;
    for (const d of detalles) {
      if (excludeId && d.id === excludeId) continue;
      total += Number(convertirAMoneyValues(Number(d.montoEstimado), d.moneda, hoy).bs);
    }
    total += Number(convertirAMoneyValues(montoNuevo, monedaNueva, hoy).bs);
    return total as Money;
  };

  const limiteBs = convertirAMoneyValues(Number(categoriaLimite), categoriaLimiteMoneda, hoy).bs;

  if (!open) return null;

  const handleEdit = (d: CategoriaDetalle) => {
    setEditingId(d.id);
    setNombre(d.nombre);
    setMontoInput(String(Number(d.montoEstimado)));
    setMoneda(d.moneda);
    setColor(d.color);
    setOrden(String(d.orden));
    setFormOpen(true);
  };

  const handleSave = () => {
    if (!nombre.trim() || !montoInput) return;
    const montoNum = parseFloat(montoInput) || 0;
    const data = {
      categoriaId: categoriaId as CategoriaId,
      nombre: nombre.trim(),
      montoEstimado: moneda === "USD" ? usd(montoNum) : bs(montoNum),
      moneda,
      orden: parseInt(orden, 10) || 1,
      color: color as HexColor,
    };

    const totalBsSave = calcTotalDetallesBs(montoNum, moneda, editingId ?? undefined);
    const excedente = Number(totalBsSave) - Number(limiteBs);

    if (editingId) {
      onUpdate(editingId, data);
    } else {
      onAdd(data);
    }

    if (excedente > 0 && onUpdateCategoria) {
      onUpdateCategoria(categoriaId, {
        limite: totalBsSave,
        limiteMoneda: "Bs",
      });
    }

    resetForm();
    setFormOpen(false);
  };

  const montoNum = montoInput ? (parseFloat(montoInput) || 0) : 0;
  const totalBs = montoNum > 0 ? calcTotalDetallesBs(montoNum, moneda, editingId ?? undefined) : (0 as Money);
  const excedenteBs = Number(totalBs) - Number(limiteBs);
  const overLimit = montoNum > 0 && excedenteBs > 0;

  const handleDelete = (id: string) => {
    if (window.confirm("¿Eliminar este detalle?")) {
      onDelete(id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-2xl bg-white p-6 dark:bg-zinc-900 sm:rounded-2xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Detalles de ${categoriaNombre}`}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Detalles</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{categoriaNombre}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700">
            <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Lista de detalles */}
        <div className="space-y-2 mb-4">
          {detalles.length === 0 && !formOpen && (
            <p className="text-sm text-zinc-400 dark:text-zinc-500 py-4 text-center">
              Sin detalles. Agrega uno para desglosar esta categoría.
            </p>
          )}
          {detalles.map((d) => {
            const pair = fromCartera(Number(d.montoEstimado), d.moneda);
            return (
              <div
                key={d.id}
                className="flex items-center gap-3 py-3 px-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl"
              >
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{d.nombre}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">{pair.primary}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(d)}
                    className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    aria-label="Editar"
                  >
                    <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(d.id)}
                    className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    aria-label="Eliminar"
                  >
                    <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Formulario inline */}
        {formOpen && (
          <div className="border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 mb-4 space-y-3">
            <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {editingId ? "Editar detalle" : "Nuevo detalle"}
            </h3>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Nombre</label>
              <input
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:border-zinc-400"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Desayuno"
                autoFocus
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Monto estimado</label>
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:border-zinc-400"
                  type="number"
                  step="any"
                  value={montoInput}
                  onChange={(e) => setMontoInput(e.target.value)}
                  placeholder="0"
                />
                <select
                  className="rounded-lg border border-zinc-300 px-2 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:border-zinc-400"
                  value={moneda}
                  onChange={(e) => setMoneda(e.target.value as MonedaBudget)}
                >
                  <option value="Bs">Bs</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Color</label>
              <ColorPicker value={color} onChange={setColor} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Orden</label>
              <input
                className="w-20 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:border-zinc-400"
                type="number"
                min={1}
                value={orden}
                onChange={(e) => setOrden(e.target.value)}
              />
            </div>

            {overLimit && (
              <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-2">
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Total de detalles: <span className="font-mono font-semibold">{fromCartera(totalBs, "Bs").primary}</span>.
                  Excede el límite de la categoría (<span className="font-mono">{fromCartera(limiteBs, "Bs").primary}</span>) por{" "}
                  <span className="font-mono font-semibold">{fromCartera(bs(excedenteBs), "Bs").primary}</span>.
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  Al guardar, el límite se actualizará automáticamente.
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                className="flex-1 rounded-lg border border-zinc-300 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
                onClick={() => { resetForm(); setFormOpen(false); }}
              >
                Cancelar
              </button>
              <button
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                  overLimit
                    ? "bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600"
                    : "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                }`}
                onClick={handleSave}
              >
                {overLimit ? "Guardar y actualizar límite" : "Guardar"}
              </button>
            </div>
          </div>
        )}

        {/* Botón agregar */}
        {!formOpen && (
          <button
            className="w-full rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-600 py-3 text-sm font-medium text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 dark:hover:border-zinc-500 dark:hover:text-zinc-300 transition-colors"
            onClick={() => {
              setEditingId(null);
              setNombre("");
              setMontoInput("");
              setColor("#3B82F6");
              setOrden(String(detalles.length + 1));
              setFormOpen(true);
            }}
          >
            + Agregar detalle
          </button>
        )}

        <div className="mt-5">
          <button
            className="w-full rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

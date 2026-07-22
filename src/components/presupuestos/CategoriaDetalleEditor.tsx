"use client";

import { useState } from "react";
import type { CategoriaDetalle, Categoria, MonedaBudget } from "@/types/presupuesto";
import type { HexColor } from "@/types/hex-color";
import { bs, usd, type Money } from "@/lib/money";
import { useMonedaActiva } from "@/hooks/useMonedaActiva";
import { convertirAMoneyValues } from "@/lib/conversion";
import { toIso } from "@/lib/dates";
import { Pencil, Trash2, X } from "lucide-react";
import type { CategoriaId } from "@/types/transaccion";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Field, TextInput } from "@/components/ui/Field";
import ColorPicker from "./ColorPicker";
import MoneyInput from "./MoneyInput";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

interface CategoriaDetalleEditorProps {
  open: boolean;
  categoriaId: string;
  categoriaNombre: string;
  categoriaLimite: Money;
  categoriaLimiteMoneda: MonedaBudget;
  monedaDefault: MonedaBudget;
  gastoMaximoEsperado: number;
  gastoMaximoEsperadoMoneda: MonedaBudget;
  otrasCategoriasLimitesBs: number;
  detalles: CategoriaDetalle[];
  onAdd: (data: Omit<CategoriaDetalle, "id" | "activo"> & { categoriaId: string }) => void;
  onUpdate: (id: string, data: Partial<CategoriaDetalle>) => void;
  onDelete: (id: string) => void;
  onUpdateCategoria?: (id: string, data: Partial<Categoria>) => void;
  onUpdatePresupuesto?: (data: { gastoMaximoEsperado: number; gastoMaximoEsperadoMoneda: MonedaBudget }) => void;
  onClose: () => void;
}

const DEFAULT_COLOR = "#3B82F6" as HexColor;

export default function CategoriaDetalleEditor({
  open,
  categoriaId,
  categoriaNombre,
  categoriaLimite,
  categoriaLimiteMoneda,
  monedaDefault,
  gastoMaximoEsperado,
  gastoMaximoEsperadoMoneda,
  otrasCategoriasLimitesBs,
  detalles,
  onAdd,
  onUpdate,
  onDelete,
  onUpdateCategoria,
  onUpdatePresupuesto,
  onClose,
}: CategoriaDetalleEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [pendingSave, setPendingSave] = useState<{
    totalBs: Money;
    nuevoLimiteCategoriaBs: Money;
    excedenteBs: number;
    excedenteMaximoBs: Money;
  } | null>(null);
  const [nombre, setNombre] = useState("");
  const [montoInput, setMontoInput] = useState("");
  const [moneda, setMoneda] = useState<MonedaBudget>(monedaDefault);
  const [color, setColor] = useState<HexColor>(DEFAULT_COLOR);
  const [orden, setOrden] = useState("1");

  const { fromCartera } = useMonedaActiva();
  const hoy = toIso(new Date());

  const initForm = (d?: CategoriaDetalle) => {
    setEditingId(d?.id ?? null);
    setNombre(d?.nombre ?? "");
    setMontoInput(d ? String(Number(d.montoEstimado)) : "");
    setMoneda(d?.moneda ?? monedaDefault);
    setColor(d?.color ?? DEFAULT_COLOR);
    setOrden(d ? String(d.orden) : String(detalles.length + 1));
    setFormOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setNombre("");
    setMontoInput("");
    setMoneda(monedaDefault);
    setColor(DEFAULT_COLOR);
    setOrden(String(detalles.length + 1));
    setFormOpen(false);
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

  const doSaveDetalle = (data: Omit<CategoriaDetalle, "id" | "activo"> & { categoriaId: string }) => {
    if (editingId) {
      onUpdate(editingId, data);
    } else {
      onAdd(data);
    }
  };

  const applyUpdates = (
    data: Omit<CategoriaDetalle, "id" | "activo"> & { categoriaId: string },
    totalBsSave: Money,
    excedente: number,
    excedenteMaximo: number,
  ) => {
    doSaveDetalle(data);
    if (excedente > 0 && onUpdateCategoria) {
      onUpdateCategoria(categoriaId, {
        limite: totalBsSave,
        limiteMoneda: "Bs",
      });
    }
    if (excedenteMaximo > 0 && onUpdatePresupuesto) {
      const totalConCategoria = otrasCategoriasLimitesBs + Number(totalBsSave);
      const gastoMaximoCalculado = gastoMaximoEsperadoMoneda === "USD" 
        ? Math.round(Number(convertirAMoneyValues(totalConCategoria, "Bs", hoy).usd) * 100) / 100
        : totalConCategoria;
      onUpdatePresupuesto({
        gastoMaximoEsperado: gastoMaximoCalculado,
        gastoMaximoEsperadoMoneda,
      });
    }
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
      color,
    };

    const totalBsSave = calcTotalDetallesBs(montoNum, moneda, editingId ?? undefined);
    const excedente = Number(totalBsSave) - Number(limiteBs);
    const gastoMaximoBs = Number(convertirAMoneyValues(gastoMaximoEsperado, gastoMaximoEsperadoMoneda, hoy).bs);
    const totalLimitesConNuevo = otrasCategoriasLimitesBs + Number(totalBsSave);
    const excedenteMaximo = totalLimitesConNuevo - gastoMaximoBs;

    if (excedenteMaximo > 0 && onUpdatePresupuesto) {
      setPendingSave({
        totalBs: totalBsSave,
        nuevoLimiteCategoriaBs: totalBsSave,
        excedenteBs: excedente,
        excedenteMaximoBs: bs(excedenteMaximo),
      });
      return;
    }

    applyUpdates(data, totalBsSave, excedente, excedenteMaximo);
    resetForm();
  };

  const handleConfirmExcedeMaximo = () => {
    if (!pendingSave) return;
    const montoNum = parseFloat(montoInput) || 0;
    const data = {
      categoriaId: categoriaId as CategoriaId,
      nombre: nombre.trim(),
      montoEstimado: moneda === "USD" ? usd(montoNum) : bs(montoNum),
      moneda,
      orden: parseInt(orden, 10) || 1,
      color,
    };
    const excedenteMaximo = Number(pendingSave.excedenteMaximoBs);
    applyUpdates(data, pendingSave.totalBs, pendingSave.excedenteBs, excedenteMaximo);
    setPendingSave(null);
    resetForm();
  };

  const handleCancelExcedeMaximo = () => {
    setPendingSave(null);
  };

  const montoNum = montoInput ? (parseFloat(montoInput) || 0) : 0;
  const totalBs = montoNum > 0 ? calcTotalDetallesBs(montoNum, moneda, editingId ?? undefined) : (0 as Money);
  const excedenteBs = Number(totalBs) - Number(limiteBs);
  const overLimit = montoNum > 0 && excedenteBs > 0;

  if (!open) return null;

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        ariaLabel={`Detalles de ${categoriaNombre}`}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Detalles</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{categoriaNombre}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700" aria-label="Cerrar">
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

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
                    onClick={() => initForm(d)}
                    className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    aria-label="Editar"
                  >
                    <Pencil className="w-4 h-4 text-zinc-500" />
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(d.id)}
                    className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    aria-label="Eliminar"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {formOpen && (
          <div className="border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 mb-4 space-y-3">
            <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {editingId ? "Editar detalle" : "Nuevo detalle"}
            </h3>
            <Field label="Nombre">
              <TextInput
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Desayuno"
                autoFocus
              />
            </Field>
            <MoneyInput
              label="Monto estimado"
              value={montoInput}
              onChange={setMontoInput}
              moneda={moneda}
              onMonedaChange={setMoneda}
              size="sm"
              showEquivalent={false}
              prioritizeMoneda={monedaDefault}
            />
            <Field label="Color">
              <ColorPicker value={color} onChange={setColor} />
            </Field>
            <Field label="Orden">
              <TextInput
                type="number"
                min={1}
                value={orden}
                onChange={(e) => setOrden(e.target.value)}
                className="w-20"
              />
            </Field>

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
              <Button variant="secondary" fullWidth onClick={resetForm}>
                Cancelar
              </Button>
              <Button
                fullWidth
                onClick={handleSave}
                className={overLimit ? "bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white" : ""}
              >
                {overLimit ? "Guardar y actualizar límite" : "Guardar"}
              </Button>
            </div>
          </div>
        )}

        {!formOpen && (
          <button
            className="w-full rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-600 py-3 text-sm font-medium text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 dark:hover:border-zinc-500 dark:hover:text-zinc-300 transition-colors"
            onClick={() => initForm()}
          >
            + Agregar detalle
          </button>
        )}

        <div className="mt-5">
          <Button variant="primary" fullWidth onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmDeleteId !== null}
        title="Eliminar detalle"
        message="¿Eliminar este detalle? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        confirmTone="danger"
        onConfirm={() => {
          if (confirmDeleteId) onDelete(confirmDeleteId);
          setConfirmDeleteId(null);
        }}
        onCancel={() => setConfirmDeleteId(null)}
      />

      <ConfirmDialog
        open={pendingSave !== null}
        title="Excede el gasto máximo esperado"
        message={`El nuevo límite de la categoría (${fromCartera(pendingSave?.nuevoLimiteCategoriaBs ?? bs(0), "Bs").primary}) hace que el total de categorías supere el gasto máximo esperado por ${fromCartera(pendingSave?.excedenteMaximoBs ?? bs(0), "Bs").primary}. Al guardar, el gasto máximo esperado se actualizará automáticamente.`}
        confirmLabel="Guardar y actualizar"
        confirmTone="primary"
        onConfirm={handleConfirmExcedeMaximo}
        onCancel={handleCancelExcedeMaximo}
      />
    </>
  );
}

"use client";

import { useState } from "react";
import type { MetaCartera, MetaCarteraFormData } from "@/types/cartera";
import type { ISODate } from "@/lib/dates";

interface MetaEditorProps {
  open: boolean;
  meta?: MetaCartera;
  moneda: string;
  onSave: (data: MetaCarteraFormData) => void;
  onClose: () => void;
}

export default function MetaEditor({ open, meta, moneda, onSave, onClose }: MetaEditorProps) {
  const [nombre, setNombre] = useState(meta?.nombre ?? "");
  const [monto, setMonto] = useState(meta ? String(meta.montoObjetivo) : "");
  const [fecha, setFecha] = useState(meta?.fechaMeta ?? "");
  const [notas, setNotas] = useState(meta?.notas ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!nombre.trim()) e.nombre = "El nombre es obligatorio";
    const m = parseFloat(monto);
    if (!monto || isNaN(m) || m <= 0) e.monto = "El monto debe ser mayor a 0";
    if (notas.length > 240) e.notas = "Máximo 240 caracteres";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({
      nombre: nombre.trim(),
      montoObjetivo: parseFloat(monto),
      fechaMeta: fecha ? (fecha as ISODate) : undefined,
      notas: notas.trim() || undefined,
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-2xl bg-white p-6 dark:bg-zinc-900 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={meta ? "Editar meta" : "Nueva meta"}
      >
        <h2 className="mb-5 text-lg font-bold text-zinc-900 dark:text-zinc-50">
          {meta ? "Editar meta" : "Nueva meta"}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Nombre</label>
            <input
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:border-zinc-400"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Fondo de emergencia"
            />
            {errors.nombre && <p className="mt-1 text-xs text-red-500">{errors.nombre}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Monto objetivo ({moneda})
            </label>
            <input
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:border-zinc-400"
              type="number"
              step="any"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="0"
            />
            {errors.monto && <p className="mt-1 text-xs text-red-500">{errors.monto}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Fecha meta (opcional)</label>
            <input
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:border-zinc-400"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Notas (opcional)</label>
            <textarea
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:border-zinc-400 resize-none"
              rows={3}
              maxLength={240}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Notas adicionales..."
            />
            <p className="mt-1 text-right text-xs text-zinc-400">{notas.length}/240</p>
            {errors.notas && <p className="mt-1 text-xs text-red-500">{errors.notas}</p>}
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            className="flex-1 rounded-lg border border-zinc-300 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className="flex-1 rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            onClick={handleSave}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

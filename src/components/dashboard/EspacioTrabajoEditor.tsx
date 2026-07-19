"use client";

import { useState } from "react";
import type { EspacioTrabajo } from "@/types/espacio-trabajo";
import type { Moneda } from "@/types/cartera";

interface EspacioTrabajoEditorProps {
  open: boolean;
  espacio?: EspacioTrabajo;
  onSave: (data: { nombre: string; monedaDefault: Moneda }) => void;
  onClose: () => void;
}

export default function EspacioTrabajoEditor({
  open,
  espacio,
  onSave,
  onClose,
}: EspacioTrabajoEditorProps) {
  const [nombre, setNombre] = useState(espacio?.nombre ?? "");
  const [moneda, setMoneda] = useState<Moneda>(espacio?.monedaDefault ?? "Bs");

  if (!open) return null;

  const handleSave = () => {
    if (!nombre.trim()) return;
    onSave({ nombre: nombre.trim(), monedaDefault: moneda });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-2xl bg-white p-6 dark:bg-zinc-900 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={espacio ? "Editar espacio de trabajo" : "Nuevo espacio de trabajo"}
      >
        <h2 className="mb-5 text-lg font-bold text-zinc-900 dark:text-zinc-50">
          {espacio ? "Editar espacio" : "Nuevo espacio"}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Nombre</label>
            <input
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:border-zinc-400"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Personal, Negocio"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Moneda default</label>
            <select
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:border-zinc-400"
              value={moneda}
              onChange={(e) => setMoneda(e.target.value as Moneda)}
            >
              <option value="Bs">Bs</option>
              <option value="USD">USD</option>
              <option value="USDT">USDT</option>
              <option value="BTC">BTC</option>
              <option value="ETH">ETH</option>
            </select>
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
            {espacio ? "Guardar" : "Crear"}
          </button>
        </div>
      </div>
    </div>
  );
}

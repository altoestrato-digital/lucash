"use client";

import { useState } from "react";
import type { Cartera, CarteraInput, TipoCartera, Moneda, ObjetivoCartera } from "@/types/cartera";
import { MONEDAS_POR_TIPO } from "@/types/cartera";
import { usePreferencias } from "@/hooks/usePreferencias";

interface CarteraEditorProps {
  open: boolean;
  cartera?: Cartera;
  onSave: (data: CarteraInput) => void;
  onClose: () => void;
}

const COLORS = [
  "#10B981", "#3B82F6", "#8B5CF6", "#F97316",
  "#EF4444", "#F59E0B", "#6366F1", "#EC4899",
  "#14B8A6", "#60A5FA", "#A78BFA", "#FB923C",
  "#F87171", "#FBBF24", "#818CF8", "#F472B6",
];

export default function CarteraEditor({ open, cartera, onSave, onClose }: CarteraEditorProps) {
  const { preferencias } = usePreferencias();
  const [nombre, setNombre] = useState(cartera?.nombre ?? "");
  const [tipo, setTipo] = useState<TipoCartera>(cartera?.tipo ?? "efectivo");
  const [moneda, setMoneda] = useState<Moneda>(cartera?.moneda ?? "Bs");
  const [saldo, setSaldo] = useState(cartera ? String(cartera.saldo) : "");
  const [objetivo, setObjetivo] = useState<ObjetivoCartera>(cartera?.objetivo ?? "cubrir-presupuesto");
  const [color, setColor] = useState(cartera?.color ?? COLORS[0]);
  const [activo, setActivo] = useState(cartera?.activo ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleTipoChange = (newTipo: TipoCartera) => {
    const available = MONEDAS_POR_TIPO[newTipo];
    if (!available.includes(moneda)) {
      if (window.confirm(`Al cambiar el tipo, la moneda se reseteará a ${available[0]}. ¿Continuar?`)) {
        setTipo(newTipo);
        setMoneda(available[0]);
      }
    } else {
      setTipo(newTipo);
    }
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!nombre.trim()) e.nombre = "El nombre es obligatorio";
    const saldoNum = parseFloat(saldo);
    if (saldo && isNaN(saldoNum)) e.saldo = "Saldo inválido";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({
      nombre: nombre.trim(),
      tipo,
      moneda,
      saldo: saldo ? parseFloat(saldo) : 0,
      objetivo,
      color,
      activo,
      espacioTrabajoId: cartera?.espacioTrabajoId ?? preferencias.espacioTrabajoId,
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
        aria-label={cartera ? "Editar cartera" : "Nueva cartera"}
      >
        <h2 className="mb-5 text-lg font-bold text-zinc-900 dark:text-zinc-50">
          {cartera ? "Editar cartera" : "Nueva cartera"}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Nombre</label>
            <input
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:border-zinc-400"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Banco Provincial"
            />
            {errors.nombre && <p className="mt-1 text-xs text-red-500">{errors.nombre}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Tipo</label>
            <select
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:border-zinc-400"
              value={tipo}
              onChange={(e) => handleTipoChange(e.target.value as TipoCartera)}
            >
              <option value="efectivo">Efectivo</option>
              <option value="banco">Banco</option>
              <option value="prepago">Prepago</option>
              <option value="crypto">Crypto</option>
              <option value="inversion">Inversión</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Moneda</label>
            <select
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:border-zinc-400"
              value={moneda}
              onChange={(e) => setMoneda(e.target.value as Moneda)}
            >
              {MONEDAS_POR_TIPO[tipo].map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Saldo inicial</label>
            <input
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:border-zinc-400"
              type="number"
              step="any"
              value={saldo}
              onChange={(e) => setSaldo(e.target.value)}
              placeholder="0"
            />
            {errors.saldo && <p className="mt-1 text-xs text-red-500">{errors.saldo}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Objetivo</label>
            <div className="flex rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
              <button
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${
                  objetivo === "cubrir-presupuesto"
                    ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50"
                    : "text-zinc-500 dark:text-zinc-400"
                }`}
                onClick={() => setObjetivo("cubrir-presupuesto")}
              >
                Cubrir presupuesto
              </button>
              <button
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${
                  objetivo === "ahorro"
                    ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50"
                    : "text-zinc-500 dark:text-zinc-400"
                }`}
                onClick={() => setObjetivo("ahorro")}
              >
                Ahorro
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Color</label>
            <div className="grid grid-cols-8 gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  className={`h-7 w-7 rounded-full transition-transform ${color === c ? "ring-2 ring-zinc-500 ring-offset-2 dark:ring-offset-zinc-900 scale-110" : ""}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
            <div className="mt-3 flex items-center gap-3">
              <label className="relative h-7 w-7 cursor-pointer">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-dashed border-zinc-400 text-xs text-zinc-500 dark:border-zinc-500 dark:text-zinc-400 ${color && !COLORS.includes(color) ? "ring-2 ring-zinc-500 ring-offset-2 dark:ring-offset-zinc-900" : ""}`}
                  style={{ backgroundColor: color && !COLORS.includes(color) ? color : undefined }}
                >
                  {color && !COLORS.includes(color) ? "" : "+"}
                </span>
              </label>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {color && !COLORS.includes(color) ? color : "Color personalizado"}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Activo</label>
            <button
              className={`relative h-6 w-11 rounded-full transition-colors ${activo ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-600"}`}
              onClick={() => setActivo(!activo)}
              role="switch"
              aria-checked={activo}
            >
              <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${activo ? "translate-x-5" : ""}`} />
            </button>
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

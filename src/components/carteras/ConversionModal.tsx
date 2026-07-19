"use client";

import { useState } from "react";
import type { Cartera } from "@/types/cartera";
import { convertirAUSD, convertirABs } from "@/lib/conversion";
import { toIsoDateTime, extractDate } from "@/lib/dates";
import type { ISODateTime } from "@/lib/dates";
import { formatBs, formatUsd, usd, bs } from "@/lib/money";
import TasaConversionField from "./TasaConversionField";

interface ConversionModalProps {
  open: boolean;
  carteraOrigen: Cartera;
  carterasDestino: Cartera[];
  onConfirm: (data: { monto: number; carteraDestinoId: string; tasa: number }) => void;
  onClose: () => void;
}

export default function ConversionModal({ open, carteraOrigen, carterasDestino, onConfirm, onClose }: ConversionModalProps) {
  const [monto, setMonto] = useState("");
  const [carteraDestinoId, setCarteraDestinoId] = useState(carterasDestino?.length === 1 ? carterasDestino[0]?.id : "");
  const [fecha, setFecha] = useState<string>(toIsoDateTime(new Date()));
  const [tasaInput, setTasaInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!open) return null;

  const carteraDestino = carterasDestino.find((c) => c.id === carteraDestinoId);
  const tasaNum = parseFloat(tasaInput) || 0;

  const suggestedTasa = (() => {
    if (!carteraDestino) return 0;
    if (carteraOrigen.moneda === carteraDestino.moneda) return 1;
    if (carteraOrigen.moneda === "USD" || carteraOrigen.moneda === "USDT") return 1;
    if (carteraDestino.moneda === "USD" || carteraDestino.moneda === "USDT") return 1;
    return 0;
  })();

  const montoNum = parseFloat(monto) || 0;
  const fechaDate = extractDate(fecha as ISODateTime);
  const montoUsdDestino = carteraDestino ? convertirAUSD(montoNum * (tasaNum || 1), carteraDestino.moneda, fechaDate) : usd(0);
  const montoBsDestino = carteraDestino ? convertirABs(montoUsdDestino, fechaDate) : bs(0);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    const m = parseFloat(monto);
    if (!monto || isNaN(m) || m <= 0) e.monto = "El monto debe ser mayor a 0";
    else if (m > carteraOrigen.saldo) e.monto = `El saldo máximo es ${carteraOrigen.saldo.toLocaleString()} ${carteraOrigen.moneda}`;
    if (!carteraDestinoId) e.destino = "Seleccioná una cartera destino";
    if (tasaInput && (isNaN(tasaNum) || tasaNum <= 0)) e.tasa = "Tasa inválida";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleConfirm = () => {
    if (!validate()) return;
    onConfirm({ monto: montoNum, carteraDestinoId, tasa: tasaNum || suggestedTasa || 1 });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-2xl bg-white p-6 dark:bg-zinc-900 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Convertir"
      >
        <h2 className="mb-5 text-lg font-bold text-zinc-900 dark:text-zinc-50">Convertir</h2>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Monto a convertir ({carteraOrigen.moneda})
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
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Cartera destino</label>
            <select
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:border-zinc-400"
              value={carteraDestinoId}
              onChange={(e) => setCarteraDestinoId(e.target.value)}
            >
              <option value="">Seleccionar...</option>
              {carterasDestino.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre} ({c.moneda})</option>
              ))}
            </select>
            {errors.destino && <p className="mt-1 text-xs text-red-500">{errors.destino}</p>}
          </div>

          <TasaConversionField
            value={tasaInput}
            onChange={setTasaInput}
            moneda={carteraOrigen.moneda}
            suggested={suggestedTasa}
            fecha={fecha}
          />

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Fecha</label>
            <input
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:border-zinc-400"
              type="datetime-local"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>

          {carteraDestino && montoNum > 0 && (
            <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Vas a mover <strong className="text-zinc-900 dark:text-zinc-50">{montoNum.toLocaleString()} {carteraOrigen.moneda}</strong> a{" "}
                <strong className="text-zinc-900 dark:text-zinc-50">{carteraDestino.nombre}</strong>, recibiendo aprox{" "}
                <strong className="text-zinc-900 dark:text-zinc-50">{formatBs(montoBsDestino)}</strong> /{" "}
                <strong className="text-zinc-900 dark:text-zinc-50">{formatUsd(montoUsdDestino)}</strong>
              </p>
            </div>
          )}
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
            onClick={handleConfirm}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

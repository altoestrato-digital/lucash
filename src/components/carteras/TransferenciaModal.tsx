"use client";

import { useState, useMemo } from "react";
import type { Cartera } from "@/types/cartera";
import { toIsoDateTime, extractDate } from "@/lib/dates";
import type { ISODateTime } from "@/lib/dates";
import { lookupBcv } from "@/lib/conversion";

interface TransferenciaData {
  carteraDestinoId: string;
  montoOrigen: number;
  montoDestino: number;
  comisionOrigen: number;
  comisionDestino: number;
  tasaResultante: number;
  fecha: ISODateTime;
}

interface TransferenciaModalProps {
  open: boolean;
  carteraOrigen?: Cartera;
  carterasDestino: Cartera[];
  onConfirm: (data: TransferenciaData) => void;
  onClose: () => void;
}

export default function TransferenciaModal({
  open,
  carteraOrigen,
  carterasDestino,
  onConfirm,
  onClose,
}: TransferenciaModalProps) {
  const [carteraDestinoId, setCarteraDestinoId] = useState("");
  const [montoOrigenInput, setMontoOrigenInput] = useState("");
  const [montoDestinoInput, setMontoDestinoInput] = useState("");
  const [comisionOrigenInput, setComisionOrigenInput] = useState("");
  const [comisionDestinoInput, setComisionDestinoInput] = useState("");
  const [fecha, setFecha] = useState<string>(toIsoDateTime(new Date()));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const carteraDestino = carterasDestino.find((c) => c.id === carteraDestinoId);
  const esMismaMoneda = carteraDestino?.moneda === carteraOrigen?.moneda;

  const montoOrigen = parseFloat(montoOrigenInput) || 0;
  const montoDestino = parseFloat(montoDestinoInput) || 0;
  const comisionOrigen = parseFloat(comisionOrigenInput) || 0;
  const comisionDestino = parseFloat(comisionDestinoInput) || 0;

  const fechaDate = extractDate(fecha as ISODateTime);
  const tasaOficial = useMemo(() => {
    if (!carteraDestino || esMismaMoneda) return 0;
    const entry = lookupBcv(fechaDate);
    return entry ? Number(entry) : 0;
  }, [carteraDestino, esMismaMoneda, fechaDate]);

  const tasaResultante = useMemo(() => {
    if (esMismaMoneda || montoOrigen <= 0) return 0;
    const efectivo = montoOrigen - comisionOrigen;
    return efectivo > 0 ? montoDestino / efectivo : 0;
  }, [esMismaMoneda, montoOrigen, comisionOrigen, montoDestino]);

  const tasaDiff = useMemo(() => {
    if (tasaOficial <= 0 || tasaResultante <= 0) return null;
    return ((tasaResultante - tasaOficial) / tasaOficial) * 100;
  }, [tasaOficial, tasaResultante]);

  if (!open || !carteraOrigen) return null;

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!carteraDestinoId) e.destino = "Seleccioná una cartera destino";
    if (montoOrigen <= 0) e.montoOrigen = "El monto debe ser mayor a 0";
    if (montoOrigen + comisionOrigen > carteraOrigen.saldo) {
      e.montoOrigen = `El saldo máximo es ${carteraOrigen.saldo.toLocaleString()} ${carteraOrigen.moneda}`;
    }
    if (!esMismaMoneda && montoDestino <= 0) {
      e.montoDestino = "El monto a recibir debe ser mayor a 0";
    }
    if (comisionOrigen < 0) e.comisionOrigen = "La comisión no puede ser negativa";
    if (!esMismaMoneda && comisionDestino < 0) e.comisionDestino = "La comisión no puede ser negativa";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleConfirm = () => {
    if (!validate()) return;
    onConfirm({
      carteraDestinoId,
      montoOrigen,
      montoDestino: esMismaMoneda ? montoOrigen - comisionOrigen : montoDestino,
      comisionOrigen,
      comisionDestino: esMismaMoneda ? 0 : comisionDestino,
      tasaResultante: esMismaMoneda ? 1 : tasaResultante,
      fecha: fecha as ISODateTime,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-2xl bg-white p-6 dark:bg-zinc-900 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Transferir"
      >
        <h2 className="mb-5 text-lg font-bold text-zinc-900 dark:text-zinc-50">Transferir</h2>

        <div className="space-y-4">
          <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Origen</p>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {carteraOrigen.nombre} — {carteraOrigen.moneda}
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Cartera destino
            </label>
            <select
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:border-zinc-400"
              value={carteraDestinoId}
              onChange={(e) => {
                setCarteraDestinoId(e.target.value);
                setMontoDestinoInput("");
                setComisionDestinoInput("");
              }}
            >
              <option value="">Seleccionar...</option>
              {carterasDestino.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} ({c.moneda})
                </option>
              ))}
            </select>
            {errors.destino && <p className="mt-1 text-xs text-red-500">{errors.destino}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Monto a enviar ({carteraOrigen.moneda})
            </label>
            <input
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:border-zinc-400"
              type="number"
              step="any"
              value={montoOrigenInput}
              onChange={(e) => setMontoOrigenInput(e.target.value)}
              placeholder="0"
            />
            {errors.montoOrigen && <p className="mt-1 text-xs text-red-500">{errors.montoOrigen}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Comisión ({carteraOrigen.moneda})
            </label>
            <input
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:border-zinc-400"
              type="number"
              step="any"
              value={comisionOrigenInput}
              onChange={(e) => setComisionOrigenInput(e.target.value)}
              placeholder="0"
            />
            {errors.comisionOrigen && <p className="mt-1 text-xs text-red-500">{errors.comisionOrigen}</p>}
          </div>

          {!esMismaMoneda && carteraDestino && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Monto a recibir ({carteraDestino.moneda})
                </label>
                <input
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:border-zinc-400"
                  type="number"
                  step="any"
                  value={montoDestinoInput}
                  onChange={(e) => setMontoDestinoInput(e.target.value)}
                  placeholder="0"
                />
                {errors.montoDestino && <p className="mt-1 text-xs text-red-500">{errors.montoDestino}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Comisión ({carteraDestino.moneda})
                </label>
                <input
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:border-zinc-400"
                  type="number"
                  step="any"
                  value={comisionDestinoInput}
                  onChange={(e) => setComisionDestinoInput(e.target.value)}
                  placeholder="0"
                />
                {errors.comisionDestino && <p className="mt-1 text-xs text-red-500">{errors.comisionDestino}</p>}
              </div>

              <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Tasa de cambio</p>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    1 {carteraOrigen.moneda} = {tasaResultante > 0 ? tasaResultante.toFixed(4) : "—"} {carteraDestino.moneda}
                  </span>
                  {tasaDiff !== null && (
                    <span className={`text-xs font-medium ${tasaDiff >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                      {tasaDiff >= 0 ? "+" : ""}{tasaDiff.toFixed(1)}% vs oficial
                    </span>
                  )}
                </div>
                {tasaOficial > 0 && (
                  <p className="mt-1 text-xs text-zinc-400">
                    Oficial: 1 {carteraOrigen.moneda} = {tasaOficial.toFixed(4)} {carteraDestino.moneda}
                  </p>
                )}
              </div>
            </>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Fecha</label>
            <input
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:border-zinc-400"
              type="datetime-local"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>

          {carteraDestino && montoOrigen > 0 && (
            <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {esMismaMoneda ? (
                  <>
                    Transferirás{" "}
                    <strong className="text-zinc-900 dark:text-zinc-50">
                      {carteraOrigen.moneda} {(montoOrigen - comisionOrigen).toLocaleString()}
                    </strong>{" "}
                    a <strong className="text-zinc-900 dark:text-zinc-50">{carteraDestino.nombre}</strong>
                    {comisionOrigen > 0 && (
                      <span className="text-zinc-500"> (comisión: {comisionOrigen.toLocaleString()} {carteraOrigen.moneda})</span>
                    )}
                  </>
                ) : (
                  <>
                    Envías{" "}
                    <strong className="text-zinc-900 dark:text-zinc-50">
                      {montoOrigen.toLocaleString()} {carteraOrigen.moneda}
                    </strong>{" "}
                    → Recibes{" "}
                    <strong className="text-zinc-900 dark:text-zinc-50">
                      {montoDestino.toLocaleString()} {carteraDestino.moneda}
                    </strong>
                  </>
                )}
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

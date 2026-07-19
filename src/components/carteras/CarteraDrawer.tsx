"use client";

import type { Cartera, MetaCartera, MovimientoCartera, TipoCartera } from "@/types/cartera";
import { formatDate, formatDateTime } from "@/lib/dates";
import MovimientoCarteraList from "./MovimientoCarteraList";
import { useMonedaActiva } from "@/hooks/useMonedaActiva";
import { ArrowLeftRight } from "lucide-react";

interface CarteraDrawerProps {
  open: boolean;
  cartera: Cartera;
  metas: MetaCartera[];
  movimientos: MovimientoCartera[];
  onClose: () => void;
  onEdit: () => void;
  onConvertir: () => void;
  onTransferir: () => void;
  onEditMeta: (meta: MetaCartera) => void;
  onAddMeta: () => void;
  carteras: Cartera[];
}

const TIPO_COLORS: Record<TipoCartera, string> = {
  efectivo: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  banco: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  prepago: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  crypto: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  inversion: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
};

const TIPO_ICON_MOV: Record<string, { color: string; label: string }> = {
  "conversion-salida": { color: "text-red-500", label: "Salida" },
  "conversion-entrada": { color: "text-emerald-500", label: "Entrada" },
  ajuste: { color: "text-gray-400", label: "Ajuste" },
};

export default function CarteraDrawer({
  open, cartera, metas, movimientos, onClose, onEdit, onConvertir, onTransferir,
  onEditMeta, onAddMeta, carteras,
}: CarteraDrawerProps) {
  const { fromCartera } = useMonedaActiva();
  if (!open) return null;

  const pair = fromCartera(cartera?.saldo ?? 0, cartera?.moneda ?? "Bs");

  const metasCartera = metas.filter((m) => m.carteraId === cartera?.id);
  const conversiones = movimientos
    .filter((m) => m.carteraId === cartera?.id && m.tipo !== "ajuste")
    .slice(-5);
  const historial = movimientos.filter((m) => m.carteraId === cartera?.id);
  const esConvertible = cartera?.tipo === "crypto" || cartera?.tipo === "inversion";

  const carteraName = (id: string) => carteras.find((c) => c.id === id)?.nombre ?? "—";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full flex-col rounded-t-2xl bg-white dark:bg-zinc-900 sm:max-h-[80vh] sm:max-w-md sm:rounded-b-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={cartera.nombre}
      >
        <div className="shrink-0 px-5 pt-4 pb-3">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-zinc-300 dark:bg-zinc-600" />
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{cartera.nombre}</h2>
            <span className={`rounded px-2 py-0.5 text-[11px] font-medium ${TIPO_COLORS[cartera.tipo]}`}>
              {cartera.tipo}
            </span>
            <span className="rounded bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
              {cartera.moneda}
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {pair.primary}
          </p>
          <p className="text-sm text-zinc-400 dark:text-zinc-500">
            {pair.secondary}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-4">
          {(cartera.objetivo === "ahorro" || esConvertible) && (
            <section className="mb-5">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Metas</h3>
                <button className="text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200" onClick={onAddMeta}>
                  + Agregar
                </button>
              </div>
              {metasCartera.length === 0 ? (
                <p className="text-sm text-zinc-400 dark:text-zinc-500">Sin metas definidas</p>
              ) : (
                metasCartera.map((m) => {
                  const progress = m.montoObjetivo > 0 ? Math.min(cartera.saldo / m.montoObjetivo, 1) : 0;
                  return (
                    <div
                      key={m.id}
                      className="mb-2 cursor-pointer rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50"
                      onClick={() => onEditMeta(m)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{m.nombre}</span>
                        <span className="text-xs text-zinc-400">{Math.round(progress * 100)}%</span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                        <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progress * 100}%` }} />
                      </div>
                      {m.fechaMeta && (
                        <p className="mt-1 text-xs text-zinc-400">Meta: {formatDate(m.fechaMeta)}</p>
                      )}
                    </div>
                  );
                })
              )}
            </section>
          )}

          {conversiones.length > 0 && (
            <section className="mb-5">
              <h3 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Últimas conversiones</h3>
              <div className="space-y-1.5">
                {conversiones.map((m) => {
                  const info = TIPO_ICON_MOV[m.tipo] ?? { color: "text-gray-400", label: m.tipo };
                  return (
                    <div key={m.id} className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800/50">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium ${info.color}`}>{info.label}</span>
                        <div>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">{formatDateTime(m.fecha)}</p>
                          {m.carteraContraparteId && (
                            <p className="text-xs text-zinc-400">{carteraName(m.carteraContraparteId)}</p>
                          )}
                        </div>
                      </div>
                      <span className={`text-sm font-semibold ${m.tipo === "conversion-entrada" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                        {m.tipo === "conversion-entrada" ? "+" : "-"}{m.monto.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section>
            <h3 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Historial</h3>
            <MovimientoCarteraList movimientos={historial} carteras={carteras} />
          </section>
        </div>

        <div className="sticky bottom-0 shrink-0 border-t border-zinc-200 bg-white px-5 py-3 dark:border-zinc-700 dark:bg-zinc-900">
          <div className="flex gap-3">
            {esConvertible && (
              <button
                className="flex-1 rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                onClick={onConvertir}
              >
                Convertir a disponible
              </button>
            )}
            <button
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-colors ${cartera.saldo <= 0 ? "border-zinc-200 text-zinc-400 cursor-not-allowed dark:border-zinc-700 dark:text-zinc-600" : "border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"}`}
              disabled={cartera.saldo <= 0}
              onClick={onTransferir}
            >
              <ArrowLeftRight className="h-4 w-4" />
              Transferir
            </button>
            <button
              className="flex-1 rounded-lg border border-zinc-300 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
              onClick={onEdit}
            >
              Editar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

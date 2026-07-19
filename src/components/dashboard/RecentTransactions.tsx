"use client";

import { ArrowRight, ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { Transaccion } from "@/types/transaccion";
import { formatDateShort } from "@/lib/dates";
import { useMonedaActiva } from "@/hooks/useMonedaActiva";

interface RecentTransactionsProps {
  transacciones: Transaccion[];
  onTxClick: (tx: Transaccion) => void;
  onVerTodos: () => void;
}

export default function RecentTransactions({ transacciones, onTxClick, onVerTodos }: RecentTransactionsProps) {
  const { formatPair } = useMonedaActiva();
  return (
    <div className="rounded-2xl bg-surface border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">Movimientos recientes</h3>
          <p className="text-xs text-muted mt-0.5">Últimas transacciones</p>
        </div>
        <button
          onClick={onVerTodos}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-dark transition-colors group"
        >
          Ver todo <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      {transacciones.length === 0 ? (
        <p className="text-sm text-muted py-8 text-center">Sin movimientos</p>
      ) : (
        <div className="space-y-1">
          {transacciones.map((tx) => {
            const isIngreso = tx.tipo === "ingreso";
            const pair = formatPair(tx.montoBs, tx.montoUsd);
            return (
              <button
                key={tx.id}
                onClick={() => onTxClick(tx)}
                className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all duration-200 hover:bg-surface-elevated active:scale-[0.99]"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isIngreso ? "bg-emerald-500/10" : "bg-rose-500/10"}`}>
                  {isIngreso ? (
                    <ArrowUpRight className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <ArrowDownRight className="h-5 w-5 text-rose-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{tx.emisorReceptor}</p>
                  <p className="text-xs text-muted">{formatDateShort(tx.fecha)}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${isIngreso ? "text-emerald-500" : "text-rose-500"}`}>
                    {isIngreso ? "+" : "-"}{pair.primary}
                  </p>
                  <p className="text-[11px] text-muted">{pair.secondary}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

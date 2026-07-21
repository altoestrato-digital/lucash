"use client";

import type { Transaccion } from "@/types/transaccion";
import { formatDateTime } from "@/lib/dates";
import { useMonedaActiva } from "@/hooks/useMonedaActiva";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface TransaccionRowProps {
  transaccion: Transaccion;
  onClick: () => void;
}

export default function TransaccionRow({ transaccion: tx, onClick }: TransaccionRowProps) {
  const isIngreso = tx.tipo === "ingreso";
  const { formatPair } = useMonedaActiva();
  const pair = formatPair(tx.montoBs, tx.montoUsd);

  return (
    <div
      className="flex items-center gap-3 border-b border-border/50 px-4 py-3 cursor-pointer transition-all duration-200 hover:bg-surface-elevated active:scale-[0.99]"
      onClick={onClick}
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0 ${isIngreso ? "bg-emerald-500/10" : "bg-rose-500/10"}`}>
        {isIngreso ? (
          <ArrowUpRight className="h-5 w-5 text-emerald-500" />
        ) : (
          <ArrowDownRight className="h-5 w-5 text-rose-500" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{tx.emisorReceptor}</p>
        {tx.concepto && (
          <p className="truncate text-xs text-muted">{tx.concepto}</p>
        )}
        <p className="text-[10px] text-muted">{formatDateTime(tx.fecha)}</p>
      </div>
      <div className="text-right">
        <p className={`text-sm font-bold ${isIngreso ? "text-emerald-500" : "text-rose-500"}`}>
          {isIngreso ? "+" : "-"}{pair.primary}
        </p>
        <p className="text-[10px] text-muted">{pair.secondary}</p>
      </div>
    </div>
  );
}

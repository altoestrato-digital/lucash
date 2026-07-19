"use client";

import { useMemo } from "react";
import type { Transaccion } from "@/types/transaccion";
import TransaccionRow from "./TransaccionRow";

interface TransaccionListProps {
  transacciones: Transaccion[];
  onTxClick: (tx: Transaccion) => void;
}

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function formatDayHeader(iso: string) {
  const d = new Date(iso + "T12:00:00");
  return `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}`;
}

export default function TransaccionList({ transacciones, onTxClick }: TransaccionListProps) {
  const grouped = useMemo(() => {
    const map = new Map<string, Transaccion[]>();
    for (const tx of transacciones) {
      const dateOnly = tx.fecha.includes("T") ? tx.fecha.slice(0, 10) : tx.fecha;
      if (!map.has(dateOnly)) map.set(dateOnly, []);
      map.get(dateOnly)!.push(tx);
    }
    return Array.from(map.entries());
  }, [transacciones]);

  return (
    <div className="pb-4">
      {grouped.map(([fecha, txs]) => (
        <div key={fecha}>
          <div className="sticky top-0 bg-background/80 backdrop-blur-sm px-4 py-2 z-10">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              {formatDayHeader(fecha)}
            </p>
          </div>
          {txs.map((tx) => (
            <TransaccionRow key={tx.id} transaccion={tx} onClick={() => onTxClick(tx)} />
          ))}
        </div>
      ))}
    </div>
  );
}

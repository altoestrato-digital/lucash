"use client";

import type { Transaccion } from "@/types/transaccion";
import { formatBs, formatUsd } from "@/lib/money";
import { formatDateTime } from "@/lib/dates";
import { X, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface TransaccionDrawerProps {
  open: boolean;
  transaccion: Transaccion | null;
  onClose: () => void;
}

export default function TransaccionDrawer({ open, transaccion, onClose }: TransaccionDrawerProps) {
  if (!open || !transaccion) return null;

  const tx = transaccion;
  const isIngreso = tx.tipo === "ingreso";

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-h-[80vh] overflow-y-auto rounded-t-2xl bg-surface border-t border-border px-4 pb-8 pt-6">
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-border" />
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-muted hover:text-foreground transition-colors"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6 flex items-center gap-3">
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${isIngreso ? "bg-emerald-500/10" : "bg-rose-500/10"}`}>
            {isIngreso ? (
              <ArrowUpRight className="h-6 w-6 text-emerald-500" />
            ) : (
              <ArrowDownRight className="h-6 w-6 text-rose-500" />
            )}
          </div>
          <div>
            <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${isIngreso ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}>
              {isIngreso ? "Ingreso" : "Egreso"}
            </span>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-xs text-muted">Emisor / Receptor</p>
          <p className="text-lg font-semibold text-foreground">{tx.emisorReceptor}</p>
        </div>

        {tx.concepto && (
          <div className="mb-4">
            <p className="text-xs text-muted">Concepto</p>
            <p className="text-sm text-foreground">{tx.concepto}</p>
          </div>
        )}

        {tx.descripcion && (
          <div className="mb-4">
            <p className="text-xs text-muted">Descripción</p>
            <p className="text-sm text-foreground">{tx.descripcion}</p>
          </div>
        )}

        <div className="mb-4 flex gap-3">
          <div className="flex-1 rounded-xl bg-surface-elevated border border-border p-3">
            <p className="text-xs text-muted">Monto original</p>
            <p className={`text-lg font-bold ${isIngreso ? "text-emerald-500" : "text-rose-500"}`}>
              {tx.montoOriginal} {tx.monedaOriginal}
            </p>
          </div>
        </div>

        <div className="mb-4 flex gap-3">
          <div className="flex-1 rounded-xl bg-surface-elevated border border-border p-3">
            <p className="text-xs text-muted">Monto Bs</p>
            <p className={`text-sm font-bold ${isIngreso ? "text-emerald-500" : "text-rose-500"}`}>
              {formatBs(tx.montoBs)}
            </p>
          </div>
          <div className="flex-1 rounded-xl bg-surface-elevated border border-border p-3">
            <p className="text-xs text-muted">Monto USD</p>
            <p className="text-sm font-bold text-foreground">{formatUsd(tx.montoUsd)}</p>
          </div>
        </div>

        <div className="mb-4 flex gap-3">
          <div className="flex-1 rounded-xl bg-surface-elevated border border-border p-3">
            <p className="text-xs text-muted">Tasa oficial</p>
            <p className="text-sm text-foreground">{tx.tasaOficial.toFixed(2)}</p>
          </div>
          <div className="flex-1 rounded-xl bg-surface-elevated border border-border p-3">
            <p className="text-xs text-muted">Tasa paralela</p>
            <p className="text-sm text-foreground">{tx.tasaParalelo.toFixed(2)}</p>
          </div>
        </div>

        <div className="mb-4 rounded-xl bg-surface-elevated border border-border p-3">
          <p className="text-xs text-muted">Saldo cartera</p>
          <p className="text-sm text-foreground">
            {tx.saldoPrevio} → {tx.saldoPosterior} ({tx.monedaOriginal})
          </p>
        </div>

        <div className="mb-4 rounded-xl bg-surface-elevated border border-border p-3">
          <p className="text-xs text-muted">Cartera</p>
          <p className="text-sm text-foreground">{tx.carteraId}</p>
        </div>

        {tx.categoriaId && (
          <div className="mb-4 rounded-xl bg-surface-elevated border border-border p-3">
            <p className="text-xs text-muted">Categoria</p>
            <p className="text-sm text-foreground">{tx.categoriaId}</p>
          </div>
        )}

        {tx.adjunto && (
          <div className="mb-4">
            <p className="mb-1 text-xs text-muted">Adjunto</p>
            {tx.adjunto.mimeType.startsWith("image/") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={tx.adjunto.dataUrl}
                alt={tx.adjunto.nombreArchivo}
                className="max-h-40 rounded-xl object-contain border border-border"
              />
            ) : (
              <p className="text-sm text-muted">{tx.adjunto.nombreArchivo}</p>
            )}
          </div>
        )}

        <div className="mt-6 border-t border-border pt-4">
          <p className="text-[11px] text-muted">
            Creado: {new Date(tx.createdAt).toLocaleString("es-VE")}
          </p>
          <p className="text-[11px] text-muted">
            Fecha: {formatDateTime(tx.fecha)} {tx.fuenteOcr ? "(OCR)" : ""}
          </p>
        </div>
      </div>
    </div>
  );
}

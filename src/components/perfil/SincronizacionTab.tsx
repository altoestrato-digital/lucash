"use client";

import { Smartphone } from "lucide-react";
import QrPlaceholder from "./QrPlaceholder";

export default function SincronizacionTab() {
  return (
    <div className="flex flex-col items-center gap-6 px-4 py-10">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-surface border border-border">
        <Smartphone className="h-10 w-10 text-muted" />
      </div>

      <p className="text-center text-muted text-sm max-w-xs">
        Sincronizá con tu próxima app móvil
      </p>

      <div className="border-2 border-dashed border-border rounded-2xl p-4 bg-surface">
        <QrPlaceholder />
      </div>

      <p className="text-xs text-muted font-mono select-all bg-surface-elevated px-3 py-1.5 rounded-lg border border-border">
        lucash://sync?code=DEMO123
      </p>

      <div className="relative group w-full max-w-xs">
        <label className="flex items-center justify-between px-4 py-3 rounded-xl bg-surface-elevated border border-border cursor-not-allowed opacity-60">
          <span className="text-sm text-foreground">Sincronización automática</span>
          <div className="w-11 h-6 rounded-full bg-border relative">
            <div className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-muted shadow" />
          </div>
        </label>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block px-3 py-1.5 bg-surface-elevated border border-border text-foreground text-xs rounded-xl whitespace-nowrap">
          Próximamente
        </div>
      </div>
    </div>
  );
}

"use client";

import { Camera, FolderOpen, PenLine, X } from "lucide-react";

interface Props {
  open: boolean;
  onSelect: (method: "camera" | "explorer" | "manual") => void;
  onClose: () => void;
}

export default function CargarMethodModal({ open, onSelect, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-t-2xl sm:rounded-2xl glass p-6 animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">
            ¿Cómo querés cargarlo?
          </h2>
          <button onClick={onClose} className="text-muted hover:text-foreground transition-colors" aria-label="Cerrar">
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {[
            { method: "camera" as const, icon: Camera, label: "Cámara", desc: "Tomá una foto del recibo", color: "text-primary" },
            { method: "explorer" as const, icon: FolderOpen, label: "Explorar", desc: "Seleccioná un archivo", color: "text-secondary" },
            { method: "manual" as const, icon: PenLine, label: "Manual", desc: "Completá los datos a mano", color: "text-muted" },
          ].map((opt) => (
            <button
              key={opt.method}
              onClick={() => onSelect(opt.method)}
              className="flex items-center gap-4 rounded-xl glass border border-border p-4 text-left transition-all duration-200 hover:border-border-hover hover:scale-[1.01]"
            >
              <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center ${opt.color}`}>
                <opt.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-foreground">{opt.label}</p>
                <p className="text-sm text-muted">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

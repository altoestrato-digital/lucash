"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Settings, ChevronDown, Check } from "lucide-react";
import { usePreferencias } from "@/hooks/usePreferencias";
import { espacioTrabajoRepo, subscribe } from "@/lib/db";
import type { EspacioTrabajo } from "@/types/espacio-trabajo";
import DolarToggle from "@/components/shared/DolarToggle";
import MonedaToggle from "@/components/shared/MonedaToggle";

function WorkspaceSelector() {
  const { preferencias, setEspacioTrabajoId } = usePreferencias();
  const [espacios, setEspacios] = useState<EspacioTrabajo[]>(() => espacioTrabajoRepo.list());
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return subscribe(() => {
      setEspacios(espacioTrabajoRepo.list());
    });
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const activo = espacios.find((e) => e.id === preferencias.espacioTrabajoId);
  const label = activo?.nombre ?? "Personal";

  const handleSelect = useCallback((id: string) => {
    setEspacioTrabajoId(id);
    setOpen(false);
  }, [setEspacioTrabajoId]);

  if (espacios.length <= 1) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-full bg-surface/80 backdrop-blur-xl border border-border px-3 py-1.5 text-xs font-medium text-foreground active:bg-surface-elevated transition-all touch-manipulation"
      >
        <span className="truncate max-w-[100px]">{label}</span>
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-surface-elevated shadow-lg border border-border z-50 py-1">
          {espacios.map((e) => (
            <button
              key={e.id}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${
                e.id === preferencias.espacioTrabajoId
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-foreground hover:bg-surface"
              }`}
              onClick={() => handleSelect(e.id)}
            >
              {e.id === preferencias.espacioTrabajoId && <Check className="h-3 w-3" />}
              <span className={e.id === preferencias.espacioTrabajoId ? "" : "ml-5"}>{e.nombre}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FloatingToggles() {
  const router = useRouter();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-1.5">
      <WorkspaceSelector />
      <button
        onClick={() => router.push("/perfil")}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-surface/80 backdrop-blur-xl border border-border text-muted active:text-foreground transition-all touch-manipulation lg:hidden"
        aria-label="Perfil"
      >
        <Settings className="h-4 w-4" />
      </button>
      <DolarToggle />
      <MonedaToggle />
    </div>
  );
}

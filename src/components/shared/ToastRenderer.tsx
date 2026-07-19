"use client";

import { useEffect } from "react";
import { useUIStore, type Toast } from "@/stores/ui";
import { X } from "lucide-react";

const TONE_CLASSES: Record<string, string> = {
  success: "bg-emerald-600 text-white",
  info: "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900",
  warning: "bg-amber-500 text-white",
  danger: "bg-red-600 text-white",
};

export default function ToastRenderer() {
  const toasts = useUIStore((s) => s.toasts);
  const dismissToast = useUIStore((s) => s.dismissToast);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => dismissToast(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className={`pointer-events-auto flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg animate-slide-down ${TONE_CLASSES[toast.tone] ?? TONE_CLASSES.info}`}
    >
      <div className="flex flex-col">
        <span className="text-white/70 text-xs">{toast.message}</span>
        {toast.monto && (
          <span className={toast.montoColor === "green" ? "text-emerald-300" : toast.montoColor === "red" ? "text-red-300" : "text-white"}>
            {toast.monto}
          </span>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="ml-2 shrink-0 rounded p-0.5 hover:opacity-70 transition-opacity"
        aria-label="Cerrar"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

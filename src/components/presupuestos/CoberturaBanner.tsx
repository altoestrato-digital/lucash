"use client";

import type { ResumenCobertura } from "@/types/presupuesto";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";

const alertStyles: Record<string, { bg: string; border: string; text: string; icon: React.ElementType }> = {
  "sobregiro": {
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-800",
    text: "text-red-700 dark:text-red-300",
    icon: AlertTriangle,
  },
  "excedido": {
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-800",
    text: "text-red-700 dark:text-red-300",
    icon: AlertTriangle,
  },
  "basico": {
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-800",
    text: "text-red-700 dark:text-red-300",
    icon: AlertTriangle,
  },
  "p2": {
    bg: "bg-orange-50 dark:bg-orange-950/30",
    border: "border-orange-200 dark:border-orange-800",
    text: "text-orange-700 dark:text-orange-300",
    icon: Info,
  },
  "p3": {
    bg: "bg-yellow-50 dark:bg-yellow-950/30",
    border: "border-yellow-200 dark:border-yellow-800",
    text: "text-yellow-700 dark:text-yellow-300",
    icon: Info,
  },
  "todo-cubierto": {
    bg: "bg-green-50 dark:bg-green-950/30",
    border: "border-green-200 dark:border-green-800",
    text: "text-green-700 dark:text-green-300",
    icon: CheckCircle,
  },
};

export default function CoberturaBanner({ cobertura }: { cobertura: ResumenCobertura }) {
  if (!cobertura.alertas.length) return null;

  return (
    <div className="space-y-2">
      {cobertura.alertas.map((alerta, i) => {
        const s = alertStyles[alerta.tipo] || alertStyles["todo-cubierto"];
        const Icon = s.icon;
        const role = alerta.tipo === "sobregiro" || alerta.tipo === "basico" || alerta.tipo === "excedido"
          ? "alert" as const
          : "status" as const;

        return (
          <div key={`${alerta.tipo}-${i}`} role={role} className={`flex items-start gap-3 ${s.bg} ${s.border} border rounded-xl p-4`}>
            <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${s.text}`} />
            <p className={`text-sm leading-relaxed ${s.text}`}>{alerta.mensaje}</p>
          </div>
        );
      })}
    </div>
  );
}

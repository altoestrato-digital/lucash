"use client";

import type { AlertaCobertura, ResumenCobertura } from "@/types/presupuesto";
import { useMonedaActiva } from "@/hooks/useMonedaActiva";
import { usd, type Money } from "@/lib/money";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";

const alertStyles: Record<AlertaCobertura["tipo"], { bg: string; border: string; text: string; icon: React.ElementType; role: "alert" | "status" }> = {
  "sobregiro": {
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-800",
    text: "text-red-700 dark:text-red-300",
    icon: AlertTriangle,
    role: "alert",
  },
  "excedido": {
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-800",
    text: "text-red-700 dark:text-red-300",
    icon: AlertTriangle,
    role: "alert",
  },
  "basico": {
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-800",
    text: "text-red-700 dark:text-red-300",
    icon: AlertTriangle,
    role: "alert",
  },
  "p2": {
    bg: "bg-orange-50 dark:bg-orange-950/30",
    border: "border-orange-200 dark:border-orange-800",
    text: "text-orange-700 dark:text-orange-300",
    icon: Info,
    role: "status",
  },
  "p3": {
    bg: "bg-yellow-50 dark:bg-yellow-950/30",
    border: "border-yellow-200 dark:border-yellow-800",
    text: "text-yellow-700 dark:text-yellow-300",
    icon: Info,
    role: "status",
  },
  "todo-cubierto": {
    bg: "bg-green-50 dark:bg-green-950/30",
    border: "border-green-200 dark:border-green-800",
    text: "text-green-700 dark:text-green-300",
    icon: CheckCircle,
    role: "status",
  },
};

const buildMensaje = (alerta: AlertaCobertura, formatPair: (bs: Money, usd: Money) => { primary: string; secondary: string }): string => {
  const nombres = alerta.categoriaNombres.join(", ");

  switch (alerta.tipo) {
    case "excedido": {
      const pair = formatPair(alerta.montoBs, alerta.montoUsd);
      return `Las categorías exceden el gasto máximo esperado por ${pair.primary}.`;
    }
    case "sobregiro": {
      const pair = formatPair(alerta.montoBs, alerta.montoUsd);
      return `Estás gastando más de lo que tienes. Te pasaste por ${pair.primary}.`;
    }
    case "todo-cubierto": {
      const pair = formatPair(alerta.montoBs, alerta.montoUsd);
      return `Presupuesto cubierto. Sobran ${pair.primary}.`;
    }
    case "basico":
    case "p2":
    case "p3": {
      const partes: string[] = [];
      if (alerta.excedidoBs && Number(alerta.excedidoBs) > 0) {
        const pair = formatPair(alerta.excedidoBs, alerta.excedidoUsd ?? usd(0));
        partes.push(`Te excediste por ${pair.primary} en ${nombres}`);
      }
      if (alerta.faltanBs && Number(alerta.faltanBs) > 0) {
        const pair = formatPair(alerta.faltanBs, alerta.faltanUsd ?? usd(0));
        partes.push(`Te faltan ${pair.primary} para cubrir ${nombres}`);
      }
      return partes.join(". ") + ".";
    }
  }
};

export default function CoberturaBanner({ cobertura }: { cobertura: ResumenCobertura }) {
  const { formatPair } = useMonedaActiva();

  if (!cobertura.alertas.length) return null;

  return (
    <div className="space-y-2">
      {cobertura.alertas.map((alerta) => {
        const s = alertStyles[alerta.tipo];
        const Icon = s.icon;
        const mensaje = buildMensaje(alerta, formatPair);

        return (
          <div key={alerta.id} role={s.role} className={`flex items-start gap-3 ${s.bg} ${s.border} border rounded-xl p-4`}>
            <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${s.text}`} />
            <p className={`text-sm leading-relaxed ${s.text}`}>{mensaje}</p>
          </div>
        );
      })}
    </div>
  );
}

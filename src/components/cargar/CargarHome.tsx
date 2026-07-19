"use client";

import type { TipoTransaccion } from "@/types/transaccion";
import { TrendingUp, TrendingDown } from "lucide-react";

interface Props {
  onSelectTipo: (tipo: TipoTransaccion) => void;
}

export default function CargarHome({ onSelectTipo }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-4 gap-6">
      <h1 className="text-2xl font-bold text-center text-foreground">
        ¿Qué querés registrar?
      </h1>
      <p className="text-sm text-muted text-center -mt-4">
        Elegí el tipo de movimiento
      </p>
      <button
        onClick={() => onSelectTipo("ingreso")}
        className="w-full max-w-md flex flex-col items-center gap-3 rounded-2xl glass border border-primary/20 px-6 py-8 text-primary transition-all duration-300 hover:scale-[1.02] hover:shadow-lg glow-primary active:scale-[0.98]"
      >
        <TrendingUp className="h-10 w-10" />
        <span className="text-xl font-semibold">Ingreso</span>
        <span className="text-sm text-muted">
          Cobro, transferencia, pago recibido
        </span>
      </button>
      <button
        onClick={() => onSelectTipo("egreso")}
        className="w-full max-w-md flex flex-col items-center gap-3 rounded-2xl glass border border-danger/20 px-6 py-8 text-danger transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
      >
        <TrendingDown className="h-10 w-10" />
        <span className="text-xl font-semibold">Egreso</span>
        <span className="text-sm text-muted">
          Pago, compra, retiro, transferencia enviada
        </span>
      </button>
    </div>
  );
}

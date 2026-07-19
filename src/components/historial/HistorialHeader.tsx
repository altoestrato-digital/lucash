"use client";

import { Clock } from "lucide-react";

interface HistorialHeaderProps {
  count: number;
  rango: string;
}

export default function HistorialHeader({ count, rango }: HistorialHeaderProps) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 pt-12 pb-10 px-6">
      <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/5" />
      <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-white/5" />
      <div className="relative z-10 flex items-center gap-3 mb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
          <Clock className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">
            Historial <span className="text-emerald-200">({count})</span>
          </h1>
          <p className="text-sm text-emerald-100/80">{rango}</p>
        </div>
      </div>
    </div>
  );
}

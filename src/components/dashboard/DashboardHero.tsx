"use client";

import { Wallet } from "lucide-react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface DashboardHeroProps {
  nombre: string;
}

export default function DashboardHero({ nombre }: DashboardHeroProps) {
  const saludo = nombre ? `Hola, ${nombre}` : "Hola, Lucash";
  const now = new Date();
  const fecha = now.toLocaleDateString("es-VE", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 pt-12 pb-16 px-6">
      {/* Decorative circles */}
      <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/5" />
      <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-white/5" />
      <div className="absolute top-1/2 right-1/4 h-40 w-40 rounded-full bg-white/3" />

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
            <Wallet className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-emerald-100">{fecha}</p>
          </div>
        </div>

        <h1 suppressHydrationWarning className="text-3xl font-bold text-white mb-1">
          {saludo}
        </h1>
        <Link
          href="/perfil"
          className={`inline-flex items-center gap-1 text-sm text-emerald-200 hover:text-white transition-colors ${nombre ? "invisible" : ""}`}
        >
          Completá tu perfil <ArrowRight className="h-3 w-3" />
        </Link>
        <p className="text-emerald-100/80 text-sm mt-1">Aquí está tu resumen financiero</p>
      </div>
    </div>
  );
}

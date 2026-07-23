"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface DashboardHeroProps {
  nombre: string;
  avatar?: string;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0]?.slice(0, 2) ?? "??").toUpperCase();
}

export default function DashboardHero({ nombre, avatar }: DashboardHeroProps) {
  const saludo = nombre ? `Hola, ${nombre}` : "Hola, Lucash";
  const now = new Date();
  const fecha = now.toLocaleDateString("es-VE", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 pt-16 pb-12 px-6">
      {/* Decorative circles */}
      <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/5" />
      <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-white/5" />
      <div className="absolute top-1/2 right-1/4 h-40 w-40 rounded-full bg-white/3" />

      <div className="relative z-10">
        <div className="flex items-center gap-3 mt-4">
          {avatar ? (
            <div className="h-10 w-10 overflow-hidden rounded-2xl bg-white/15 backdrop-blur-sm">
              <img src={avatar} alt="Avatar" className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm text-sm font-bold text-white">
              {initials(nombre || "LU")}
            </div>
          )}
          <h1 suppressHydrationWarning className="text-3xl font-bold text-white">
            {saludo}
          </h1>
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-emerald-100/80 text-sm">Aquí está tu resumen financiero</p>
          <p className="text-sm text-emerald-100">{fecha}</p>
        </div>
        {!nombre && (
          <Link
            href="/perfil"
            className="inline-flex items-center gap-1 mt-2 text-sm text-emerald-200 hover:text-white transition-colors"
          >
            Completá tu perfil <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
    </div>
  );
}

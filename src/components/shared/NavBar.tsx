"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PieChart, Clock, Wallet, Plus, Settings } from "lucide-react";
import { cn } from "@/lib/cn";
import { useRouter } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Inicio", icon: Home },
  { href: "/presupuestos", label: "Presupuesto", icon: PieChart },
  { href: "/historial", label: "Historial", icon: Clock },
  { href: "/carteras", label: "Carteras", icon: Wallet },
];

type MobileItem =
  | { type: "link"; href: string; label: string; icon: typeof Home }
  | { type: "fab" };

const mobileItems: MobileItem[] = [
  { type: "link", ...links[0] },
  { type: "link", ...links[1] },
  { type: "fab" },
  { type: "link", ...links[2] },
  { type: "link", ...links[3] },
];

export function NavBar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <>
      {/* Mobile bottom nav con FAB prominente centrado */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface/80 backdrop-blur-xl border-t border-border lg:hidden">
        <ul className="mx-auto flex max-w-lg items-end justify-around px-2 pt-1 pb-1">
          {mobileItems.map((item) => {
            if (item.type === "fab") {
              return (
                <li key="fab" className="flex-1 flex justify-center">
                  <button
                    onClick={() => router.push("/cargar")}
                    className="relative -mt-7 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 active:scale-95 transition-all"
                    aria-label="Cargar transacción"
                  >
                    <Plus className="h-6 w-6" />
                  </button>
                </li>
              );
            }
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-0.5 px-3 py-2 text-[10px] font-medium transition-all duration-200",
                    isActive ? "text-primary" : "text-muted"
                  )}
                >
                  <Icon className={cn("h-5 w-5", isActive && "drop-shadow-[0_0_6px_rgba(16,185,129,0.4)]")} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Desktop sidebar */}
      <nav className="fixed bottom-0 left-0 top-0 z-40 hidden w-[72px] flex-col bg-surface/80 backdrop-blur-xl border-r border-border lg:flex">
        <div className="flex h-16 items-center justify-center border-b border-border">
          <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">L$</span>
        </div>
        <ul className="flex flex-1 flex-col items-center gap-1 py-4 px-2">
          {/* FAB button above Inicio */}
          <li className="w-full mb-2">
            <button
              onClick={() => router.push("/cargar")}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 active:scale-95 transition-all duration-200"
              aria-label="Cargar transacción"
            >
              <Plus className="h-5 w-5" />
            </button>
          </li>
          {links.map((link) => {
            const isActive = pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <li key={link.href} className="w-full">
                <Link
                  href={link.href}
                  className={cn(
                    "group relative flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-[10px] font-medium transition-all duration-200",
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-muted hover:text-foreground hover:bg-surface-elevated"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{link.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Botón de configuración → /perfil */}
        <div className="px-2 pb-4">
          <button
            onClick={() => router.push("/perfil")}
            className="flex h-12 w-full items-center justify-center rounded-xl bg-surface-elevated text-muted hover:bg-surface-hover hover:text-foreground transition-all duration-200"
            aria-label="Configuración"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </nav>
    </>
  );
}

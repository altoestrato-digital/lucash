"use client";

import { useRouter } from "next/navigation";
import { Settings } from "lucide-react";
import DolarToggle from "@/components/shared/DolarToggle";
import MonedaToggle from "@/components/shared/MonedaToggle";

export default function FloatingToggles() {
  const router = useRouter();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-1.5">
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

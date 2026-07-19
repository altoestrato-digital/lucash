"use client";

import { usePerfil } from "@/hooks/usePerfil";
import MonedaPillToggle from "@/components/shared/MonedaPillToggle";

interface MonedaToggleProps {
  className?: string;
  ariaLabel?: string;
}

export default function MonedaToggle({ className, ariaLabel }: MonedaToggleProps) {
  const { perfil, updatePerfil } = usePerfil();
  const current = perfil.preferencias.moneda;
  const handleToggle = () => {
    updatePerfil({
      preferencias: {
        ...perfil.preferencias,
        moneda: current === "Bs" ? "USD" : "Bs",
      },
    });
  };
  return (
    <MonedaPillToggle
      moneda={current}
      onToggle={handleToggle}
      className={className}
      ariaLabel={ariaLabel}
    />
  );
}

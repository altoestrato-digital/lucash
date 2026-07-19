"use client";

import type { Cartera, CarteraId } from "@/types/cartera";
import { getCarterasActivas } from "@/hooks/useCarteras";

const TIPO_CHIP: Record<string, { bg: string; text: string; label: string }> = {
  efectivo: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300", label: "Efectivo" },
  banco: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300", label: "Banco" },
  prepago: { bg: "bg-violet-100 dark:bg-violet-900/30", text: "text-violet-700 dark:text-violet-300", label: "Prepago" },
  crypto: { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-300", label: "Crypto" },
  inversion: { bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-700 dark:text-indigo-300", label: "Inversión" },
};

interface Props {
  value: CarteraId | null;
  carteras: Cartera[];
  onChange: (id: CarteraId) => void;
}

export default function CarteraSelect({ value, carteras, onChange }: Props) {
  const activas = getCarterasActivas(carteras);

  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value as CarteraId)}
      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="" disabled>
        Seleccioná una cartera
      </option>
      {activas.map((cartera) => (
        <option key={cartera.id} value={cartera.id}>
          {cartera.nombre} — {TIPO_CHIP[cartera.tipo]?.label ?? cartera.tipo}
        </option>
      ))}
    </select>
  );
}

"use client";

import type { Presupuesto } from "@/types/presupuesto";

interface Props {
  value: string | null;
  presupuesto: Presupuesto | null;
  onChange: (id: string | null) => void;
}

export default function CategoriaSelect({ value, presupuesto, onChange }: Props) {
  const cats = presupuesto?.categorias?.filter((s) => s.activo) ?? [];

  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="">Presupuesto general</option>
      {cats.map((cat) => (
        <option key={cat.id} value={cat.id}>
          {cat.nombre}
        </option>
      ))}
    </select>
  );
}

"use client";

export function SubpresupuestoChip({ nombre, color, activo = true }: { nombre: string; color: string; activo?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        activo ? "" : "opacity-50"
      }`}
      style={{ backgroundColor: color + "20", color, borderColor: color, borderWidth: 1 }}
    >
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {nombre}
    </span>
  );
}

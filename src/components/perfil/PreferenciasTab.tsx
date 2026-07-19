"use client";

import { useState, useCallback } from "react";
import type { Preferencias, MonedaPreferida, FormatoFecha, InicioSemana, Tema, Idioma, FuenteTasaPreferida, CoberturaModo } from "@/types/perfil";

interface PreferenciasTabProps {
  preferencias: Preferencias;
  onMonedaChange: (v: MonedaPreferida) => void;
  onFormatoChange: (v: FormatoFecha) => void;
  onSemanaChange: (v: InicioSemana) => void;
  onTemaChange: (v: Tema) => void;
  onIdiomaChange: (v: Idioma) => void;
  onFuenteTasaChange?: (v: FuenteTasaPreferida) => void;
  onCoberturaModoChange?: (v: CoberturaModo) => void;
}

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  disabledOptions,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
  disabledOptions?: { value: T; tooltip: string }[];
}) {
  return (
    <div className="flex rounded-xl bg-surface border border-border overflow-hidden p-1">
      {options.map((opt) => {
        const disabled = disabledOptions?.find((d) => d.value === opt.value);
        return (
          <div key={opt.value} className="relative flex-1 group">
            <button
              onClick={() => !disabled && onChange(opt.value)}
              disabled={!!disabled}
              className={`w-full px-3 py-2 text-sm font-medium transition-all duration-200 rounded-lg ${
                value === opt.value
                  ? "bg-primary text-white shadow-sm"
                  : disabled
                    ? "text-muted cursor-not-allowed"
                    : "text-muted hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
            {disabled && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block px-3 py-1.5 bg-surface-elevated border border-border text-foreground text-xs rounded-xl whitespace-nowrap z-10">
                Próximamente
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function PreferenciasTab({
  preferencias,
  onMonedaChange,
  onFormatoChange,
  onSemanaChange,
  onTemaChange,
  onIdiomaChange,
  onFuenteTasaChange,
  onCoberturaModoChange,
}: PreferenciasTabProps) {
  const [toast, setToast] = useState(false);

  const handleChange = useCallback(
    <T,>(fn: (v: T) => void, value: T) => {
      fn(value);
      setToast(true);
      setTimeout(() => setToast(false), 1500);
    },
    []
  );

  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-foreground">Moneda preferida</label>
        <SegmentedControl
          options={[
            { label: "Bs", value: "Bs" as MonedaPreferida },
            { label: "USD", value: "USD" as MonedaPreferida },
          ]}
          value={preferencias.moneda}
          onChange={(v) => handleChange(onMonedaChange, v)}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-foreground">Fuente de tasa</label>
        <SegmentedControl
          options={[
            { label: "Oficial (BCV)", value: "oficial" as FuenteTasaPreferida },
            { label: "Paralelo", value: "paralelo" as FuenteTasaPreferida },
          ]}
          value={preferencias.fuenteTasa}
          onChange={(v) => onFuenteTasaChange && handleChange(onFuenteTasaChange, v)}
        />
        <p className="text-xs text-muted">
          Define qué tasa usa la app para convertir entre Bs y USD.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-foreground">Cobertura de presupuesto</label>
        <SegmentedControl
          options={[
            { label: "Ingreso esperado", value: "ingreso-esperado" as CoberturaModo },
            { label: "Cubrir con carteras", value: "carteras-cubrir" as CoberturaModo },
          ]}
          value={preferencias.coberturaModo}
          onChange={(v) => onCoberturaModoChange && handleChange(onCoberturaModoChange, v)}
        />
        <p className="text-xs text-muted">
          Define si la cobertura se calcula contra el ingreso esperado o contra el saldo de carteras asignadas.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-foreground">Formato fecha</label>
        <SegmentedControl
          options={[
            { label: "DD/MM/YYYY", value: "DD/MM/YYYY" as FormatoFecha },
            { label: "MM/DD/YYYY", value: "MM/DD/YYYY" as FormatoFecha },
          ]}
          value={preferencias.formatoFecha}
          onChange={(v) => handleChange(onFormatoChange, v)}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-foreground">Inicio semana</label>
        <SegmentedControl
          options={[
            { label: "Lunes", value: "lunes" as InicioSemana },
            { label: "Domingo", value: "domingo" as InicioSemana },
          ]}
          value={preferencias.inicioSemana}
          onChange={(v) => handleChange(onSemanaChange, v)}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-foreground">Tema</label>
        <SegmentedControl
          options={[
            { label: "Claro", value: "claro" as Tema },
            { label: "Oscuro", value: "oscuro" as Tema },
            { label: "Auto", value: "auto" as Tema },
          ]}
          value={preferencias.tema}
          onChange={(v) => handleChange(onTemaChange, v)}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-foreground">Idioma</label>
        <SegmentedControl
          options={[
            { label: "Español", value: "es" as Idioma },
            { label: "English", value: "en" as Idioma },
          ]}
          value={preferencias.idioma}
          onChange={(v) => handleChange(onIdiomaChange, v)}
          disabledOptions={[{ value: "en" as Idioma, tooltip: "Próximamente" }]}
        />
      </div>

      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-surface-elevated border border-border text-foreground text-sm rounded-xl shadow-lg z-50 animate-fade-in">
          Guardado
        </div>
      )}
    </div>
  );
}

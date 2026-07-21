"use client";

import { useState } from "react";
import type { Cartera, CarteraInput, TipoCartera, Moneda, ObjetivoCartera } from "@/types/cartera";
import { MONEDAS_POR_TIPO } from "@/types/cartera";
import { usePreferencias } from "@/hooks/usePreferencias";
import Modal from "@/components/ui/Modal";
import { Field, TextInput, Select } from "@/components/ui/Field";
import Switch from "@/components/ui/Switch";
import Button from "@/components/ui/Button";
import ColorPicker from "@/components/presupuestos/ColorPicker";
import type { HexColor } from "@/types/hex-color";

interface CarteraEditorProps {
  open: boolean;
  cartera?: Cartera;
  onSave: (data: CarteraInput) => void;
  onClose: () => void;
}

const COLORS = [
  "#10B981", "#3B82F6", "#8B5CF6", "#F97316",
  "#EF4444", "#F59E0B", "#6366F1", "#EC4899",
  "#14B8A6", "#60A5FA", "#A78BFA", "#FB923C",
  "#F87171", "#FBBF24", "#818CF8", "#F472B6",
];

export default function CarteraEditor({ open, cartera, onSave, onClose }: CarteraEditorProps) {
  const { preferencias } = usePreferencias();
  const [nombre, setNombre] = useState(cartera?.nombre ?? "");
  const [tipo, setTipo] = useState<TipoCartera>(cartera?.tipo ?? "efectivo");
  const [moneda, setMoneda] = useState<Moneda>(cartera?.moneda ?? "Bs");
  const [saldo, setSaldo] = useState(cartera ? String(cartera.saldo) : "");
  const [objetivo, setObjetivo] = useState<ObjetivoCartera>(cartera?.objetivo ?? "cubrir-presupuesto");
  const [color, setColor] = useState<HexColor>((cartera?.color ?? COLORS[0]) as HexColor);
  const [activo, setActivo] = useState(cartera?.activo ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleTipoChange = (newTipo: TipoCartera) => {
    const available = MONEDAS_POR_TIPO[newTipo];
    if (!available.includes(moneda)) {
      if (window.confirm(`Al cambiar el tipo, la moneda se reseteará a ${available[0]}. ¿Continuar?`)) {
        setTipo(newTipo);
        setMoneda(available[0]);
      }
    } else {
      setTipo(newTipo);
    }
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!nombre.trim()) e.nombre = "El nombre es obligatorio";
    const saldoNum = parseFloat(saldo);
    if (saldo && isNaN(saldoNum)) e.saldo = "Saldo inválido";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({
      nombre: nombre.trim(),
      tipo,
      moneda,
      saldo: saldo ? parseFloat(saldo) : 0,
      objetivo,
      color,
      activo,
      espacioTrabajoId: cartera?.espacioTrabajoId ?? preferencias.espacioTrabajoId,
    });
    resetForm();
  };

  const resetForm = () => {
    setNombre("");
    setTipo("efectivo");
    setMoneda("Bs");
    setSaldo("");
    setObjetivo("cubrir-presupuesto");
    setColor(COLORS[0] as HexColor);
    setActivo(true);
    setErrors({});
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      ariaLabel={cartera ? "Editar cartera" : "Nueva cartera"}
    >
      <h2 className="mb-5 text-lg font-bold text-zinc-900 dark:text-zinc-50">
        {cartera ? "Editar cartera" : "Nueva cartera"}
      </h2>

      <div className="space-y-4">
        <Field label="Nombre" error={errors.nombre}>
          <TextInput
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Banco Provincial"
          />
        </Field>

        <Field label="Tipo">
          <Select value={tipo} onChange={(e) => handleTipoChange(e.target.value as TipoCartera)}>
            <option value="efectivo">Efectivo</option>
            <option value="banco">Banco</option>
            <option value="prepago">Prepago</option>
            <option value="crypto">Crypto</option>
            <option value="inversion">Inversión</option>
          </Select>
        </Field>

        <Field label="Moneda">
          <Select value={moneda} onChange={(e) => setMoneda(e.target.value as Moneda)}>
            {MONEDAS_POR_TIPO[tipo].map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </Select>
        </Field>

        <Field label="Saldo inicial" error={errors.saldo}>
          <TextInput
            type="number"
            step="any"
            value={saldo}
            onChange={(e) => setSaldo(e.target.value)}
            placeholder="0"
          />
        </Field>

        <Field label="Objetivo">
          <div className="flex rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
            <button
              type="button"
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${
                objetivo === "cubrir-presupuesto"
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50"
                  : "text-zinc-500 dark:text-zinc-400"
              }`}
              onClick={() => setObjetivo("cubrir-presupuesto")}
            >
              Cubrir presupuesto
            </button>
            <button
              type="button"
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${
                objetivo === "ahorro"
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50"
                  : "text-zinc-500 dark:text-zinc-400"
              }`}
              onClick={() => setObjetivo("ahorro")}
            >
              Ahorro
            </button>
          </div>
        </Field>

        <Field label="Color">
          <ColorPicker value={color} onChange={setColor} />
        </Field>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Activo</label>
          <Switch checked={activo} onChange={setActivo} hideLabel />
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <Button variant="secondary" fullWidth onClick={handleCancel}>
          Cancelar
        </Button>
        <Button variant="primary" fullWidth onClick={handleSave}>
          Guardar
        </Button>
      </div>
    </Modal>
  );
}

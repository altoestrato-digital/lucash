"use client";

import { useState, useRef, useCallback } from "react";
import type { TipoTransaccion, Adjunto, SubpresupuestoId } from "@/types/transaccion";
import type { CarteraId } from "@/types/cartera";
import { toIsoDateTime, extractDate } from "@/lib/dates";
import { useCargarForm } from "@/hooks/useCargarForm";
import { useUploadOcr } from "@/hooks/useUploadOcr";
import { usePresupuesto } from "@/hooks/usePresupuesto";
import { useCarteras } from "@/hooks/useCarteras";
import { transaccionesRepo, tasasDolarApiRepo } from "@/lib/db";
import { bs, usd } from "@/lib/money";
import { convertirABs } from "@/lib/conversion";
import { useUIStore } from "@/stores/ui";
import CargarHome from "@/components/cargar/CargarHome";
import CargarMethodModal from "@/components/cargar/CargarMethodModal";
import CargarForm from "@/components/cargar/CargarForm";
import ExcedenteDialog from "@/components/cargar/ExcedenteDialog";
import UsoAhorroWarning from "@/components/cargar/UsoAhorroWarning";

type Step = "home" | "method" | "form";

export default function CargarPage() {
  const { state, setTipo, updateField, setAnalizedData, reset } = useCargarForm();
  const { analizando, analizar } = useUploadOcr();
  const { presupuesto } = usePresupuesto();
  const { carteras, addMovimiento, addCartera } = useCarteras();
  const pushToast = useUIStore((s) => s.pushToast);

  const [step, setStep] = useState<Step>("home");
  const [showExcedente, setShowExcedente] = useState(false);
  const [showAhorroWarning, setShowAhorroWarning] = useState(false);
  const [excedenteBs, setExcedenteBs] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectTipo = useCallback((tipo: TipoTransaccion) => {
    setTipo(tipo);
    setStep("method");
  }, [setTipo]);

  const handleMethodSelect = useCallback((method: "camera" | "explorer" | "manual") => {
    if (method === "manual") {
      setStep("form");
      return;
    }
    if (fileInputRef.current) {
      if (method === "camera") fileInputRef.current.setAttribute("capture", "environment");
      else fileInputRef.current.removeAttribute("capture");
      fileInputRef.current.click();
    }
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const mimeType = file.type as Adjunto["mimeType"];
    const reader = new FileReader();
    reader.onload = () => {
      const adjunto: Adjunto = {
        id: `adj-${Date.now()}`,
        nombreArchivo: file.name,
        mimeType: mimeType.startsWith("image/") || mimeType === "application/pdf" ? mimeType : "image/jpeg",
        dataUrl: reader.result as string,
        tamanoBytes: file.size,
      };
      updateField("adjunto", adjunto);
      setStep("form");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, [updateField]);

  const handleAnalizar = useCallback(async () => {
    if (!state.adjunto) return;
    const result = await analizar(state.adjunto);
    if (result) setAnalizedData(result);
  }, [state.adjunto, analizar, setAnalizedData]);

  const selectedCartera = carteras.find((c) => c.id === state.carteraId);
  const carterasAhorro = carteras.filter((c) => c.activo && c.objetivo === "ahorro");

  const doSave = useCallback(() => {
    if (!state.tipo || !state.carteraId) return;

    const montoBs = Number(state.montoBs) || 0;
    const montoUsd = Number(state.montoUsd) || 0;
    const tasaBcvNum = Number(state.tasaBcv) || 0;

    const oficialEntry = tasasDolarApiRepo.get(extractDate(state.fecha), "oficial");
    const paraleloEntry = tasasDolarApiRepo.get(extractDate(state.fecha), "paralelo");
    const tasaOficial = oficialEntry?.valor ?? tasaBcvNum;
    const tasaParalelo = paraleloEntry?.valor ?? tasaBcvNum;

    const monedaCartera = selectedCartera?.moneda ?? "Bs";
    const montoFinal = monedaCartera === "Bs"
      ? montoBs
      : montoUsd || (tasaBcvNum > 0 ? montoBs / tasaBcvNum : 0);

    const movimiento = addMovimiento({
      carteraId: state.carteraId,
      tipo: "ajuste",
      monto: state.tipo === "ingreso" ? montoFinal : -montoFinal,
      fecha: state.fecha,
      descripcion: `${state.tipo === "ingreso" ? "+" : "-"} ${state.concepto}`,
    });

    const monedaOriginal = selectedCartera?.moneda ?? "Bs";
    const excedenteValido = monedaOriginal === "Bs" || tasaBcvNum > 0;
    const montoEquivalenteBs = monedaOriginal === "Bs"
      ? montoBs
      : tasaBcvNum > 0
        ? montoFinal * tasaBcvNum
        : 0;

    transaccionesRepo.add({
      tipo: state.tipo,
      fecha: state.fecha,
      emisorReceptor: state.emisorReceptor,
      concepto: state.concepto,
      montoOriginal: montoFinal,
      monedaOriginal,
      montoBs: bs(montoBs),
      montoUsd: usd(montoUsd),
      tasaOficial,
      tasaParalelo,
      carteraId: state.carteraId,
      saldoPrevio: movimiento.saldoPrevio,
      saldoPosterior: movimiento.saldoPosterior,
      descripcion: state.descripcion || undefined,
      subPresupuestoId: state.subPresupuestoId as SubpresupuestoId | null,
      adjunto: state.adjunto ?? undefined,
      esRedireccionExcedente: false,
    });

    const ingresoEsperadoBs = presupuesto
      ? presupuesto.ingresoEsperadoMoneda === "Bs"
        ? Number(presupuesto.ingresoEsperado)
        : Number(convertirABs(presupuesto.ingresoEsperado, extractDate(state.fecha)))
      : 0;
    const excedente = state.tipo === "ingreso" && excedenteValido && montoEquivalenteBs > ingresoEsperadoBs
      ? montoEquivalenteBs - ingresoEsperadoBs
      : 0;

    const tipoLabel = state.tipo === "ingreso" ? "Ingreso" : "Egreso";
    const montoFmt = monedaCartera === "Bs"
      ? `${state.tipo === "ingreso" ? "+" : "-"}${montoBs.toLocaleString()} Bs`
      : `${state.tipo === "ingreso" ? "+" : "-"}${montoFinal.toLocaleString()} ${monedaCartera}`;
    const carteraNombre = selectedCartera?.nombre ?? "";

    reset();
    setStep("home");

    pushToast({
      tone: "success",
      message: tipoLabel,
      monto: `${montoFmt} · ${carteraNombre}`,
      montoColor: state.tipo === "ingreso" ? "green" : "red",
    });

    if (excedente > 0) {
      setExcedenteBs(excedente);
      setShowExcedente(true);
    }
  }, [state, addMovimiento, presupuesto, reset, selectedCartera, pushToast]);

  const handleSave = useCallback(() => {
    if (!state.tipo || !state.carteraId) return;

    if (selectedCartera?.objetivo === "ahorro") {
      setShowAhorroWarning(true);
      return;
    }

    doSave();
  }, [state, selectedCartera, doSave]);

  const handleConfirmAhorro = useCallback(() => {
    setShowAhorroWarning(false);
    doSave();
  }, [doSave]);

  const handleCancelAhorro = useCallback(() => {
    setShowAhorroWarning(false);
  }, []);

  const handleExcedenteConfirm = useCallback((carteraId: CarteraId) => {
    const fecha = toIsoDateTime(new Date());

    const oficialEntry = tasasDolarApiRepo.get(extractDate(fecha), "oficial");
    const paraleloEntry = tasasDolarApiRepo.get(extractDate(fecha), "paralelo");
    const tasaOficial = oficialEntry?.valor ?? 0;
    const tasaParalelo = paraleloEntry?.valor ?? 0;

    const movimiento = addMovimiento({
      carteraId,
      tipo: "ajuste",
      monto: excedenteBs,
      fecha,
      descripcion: "Redirección de excedente",
      esRedireccionExcedente: true,
    });

    const carteraDestino = carteras.find((c) => c.id === carteraId);
    const monedaOriginal = carteraDestino?.moneda ?? "Bs";

    transaccionesRepo.add({
      tipo: "ingreso",
      fecha,
      emisorReceptor: "Excedente presupuesto",
      concepto: "Redirección de excedente",
      montoOriginal: excedenteBs,
      monedaOriginal,
      montoBs: bs(excedenteBs),
      montoUsd: usd(0),
      tasaOficial,
      tasaParalelo,
      carteraId,
      saldoPrevio: movimiento.saldoPrevio,
      saldoPosterior: movimiento.saldoPosterior,
      esRedireccionExcedente: true,
    });

    setShowExcedente(false);
  }, [addMovimiento, excedenteBs, carteras]);

  const handleCrearCartera = useCallback(() => {
    addCartera({
      nombre: "Nueva cartera de ahorro",
      tipo: "efectivo",
      moneda: "Bs",
      saldo: 0,
      objetivo: "ahorro",
      color: "#F59E0B",
      activo: true,
    });
    setShowExcedente(false);
  }, [addCartera]);

  const handleCancelExcedente = useCallback(() => {
    setShowExcedente(false);
  }, []);

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      {step === "home" && <CargarHome onSelectTipo={handleSelectTipo} />}

      {step === "method" && state.tipo && (
        <CargarMethodModal
          open={true}
          onSelect={handleMethodSelect}
          onClose={() => setStep("home")}
        />
      )}

      {step === "form" && (
        <CargarForm
          state={state}
          presupuesto={presupuesto}
          carteras={carteras}
          onUpdateField={updateField}
          onSave={handleSave}
          onAnalizar={handleAnalizar}
          analizando={analizando}
        />
      )}

      <UsoAhorroWarning
        open={showAhorroWarning}
        tipo={state.tipo ?? undefined}
        onConfirm={handleConfirmAhorro}
        onCancel={handleCancelAhorro}
      />

      <ExcedenteDialog
        open={showExcedente}
        excedenteBs={excedenteBs}
        carterasAhorro={carterasAhorro}
        onConfirm={handleExcedenteConfirm}
        onCancel={handleCancelExcedente}
        onCrearCartera={handleCrearCartera}
      />
    </>
  );
}

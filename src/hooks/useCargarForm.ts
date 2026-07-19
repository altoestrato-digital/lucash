"use client";

import { useState, useCallback, useEffect } from "react";
import type { TipoTransaccion, Transaccion, Adjunto } from "@/types/transaccion";
import type { CarteraId } from "@/types/cartera";
import type { ISODateTime } from "@/lib/dates";
import { toIsoDateTime } from "@/lib/dates";

const BORRADOR_KEY = "lucash:form-borrador";

export interface CargarFormState {
  tipo: TipoTransaccion | null;
  emisorReceptor: string;
  concepto: string;
  montoBs: string;
  montoUsd: string;
  tasaBcv: string;
  tasaBcvAuto: boolean;
  categoriaId: string | null;
  descripcion: string;
  carteraId: CarteraId | null;
  fecha: ISODateTime;
  adjunto: Adjunto | null;
  analizado: boolean;
  lastEditedField: "montoBs" | "montoUsd" | null;
}

const defaultState: CargarFormState = {
  tipo: null,
  emisorReceptor: "",
  concepto: "",
  montoBs: "",
  montoUsd: "",
  tasaBcv: "",
  tasaBcvAuto: true,
  categoriaId: null,
  descripcion: "",
  carteraId: null,
  fecha: toIsoDateTime(new Date()),
  adjunto: null,
  analizado: false,
  lastEditedField: null,
};

export function useCargarForm() {
  const [state, setState] = useState<CargarFormState>(() => {
    if (typeof window === "undefined") return defaultState;
    try {
      const saved = localStorage.getItem(BORRADOR_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return defaultState;
  });

  useEffect(() => {
    localStorage.setItem(BORRADOR_KEY, JSON.stringify(state));
  }, [state]);

  const setTipo = useCallback((tipo: TipoTransaccion) => {
    setState(() => ({
      ...defaultState,
      tipo,
      fecha: toIsoDateTime(new Date()),
    }));
  }, []);

  const updateField = useCallback(<K extends keyof CargarFormState>(key: K, value: CargarFormState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setAnalizedData = useCallback((data: Partial<Transaccion>) => {
    setState((prev) => ({
      ...prev,
      emisorReceptor: data.emisorReceptor ?? prev.emisorReceptor,
      concepto: data.concepto ?? prev.concepto,
      montoBs: data.montoBs ? String(Number(data.montoBs)) : prev.montoBs,
      analizado: true,
    }));
  }, []);

  const reset = useCallback(() => {
    setState(defaultState);
    localStorage.removeItem(BORRADOR_KEY);
  }, [setState]);

  const isValid = state.tipo && state.emisorReceptor.trim() && state.concepto.trim() && state.montoBs && state.carteraId;

  return { state, setTipo, updateField, setAnalizedData, reset, isValid };
}

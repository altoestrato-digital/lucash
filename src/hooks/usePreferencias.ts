"use client";

import { useCallback, useEffect } from "react";
import type { MonedaPreferida, FormatoFecha, InicioSemana, Tema, Idioma, CoberturaModo } from "@/types/perfil";
import { PREFERENCIAS_DEFAULT } from "@/types/perfil";
import { usePerfil } from "@/hooks/usePerfil";

export function usePreferencias() {
  const { perfil, updatePerfil } = usePerfil();
  const preferencias = perfil.preferencias ?? PREFERENCIAS_DEFAULT;

  useEffect(() => {
    const root = document.documentElement;
    if (preferencias.tema === "oscuro") {
      root.classList.add("dark");
    } else if (preferencias.tema === "claro") {
      root.classList.remove("dark");
    } else {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      if (mq.matches) root.classList.add("dark");
      else root.classList.remove("dark");
    }
  }, [preferencias.tema]);

  const setMoneda = useCallback((v: MonedaPreferida) => {
    updatePerfil({ preferencias: { ...preferencias, moneda: v } });
  }, [preferencias, updatePerfil]);

  const setFormatoFecha = useCallback((v: FormatoFecha) => {
    updatePerfil({ preferencias: { ...preferencias, formatoFecha: v } });
  }, [preferencias, updatePerfil]);

  const setInicioSemana = useCallback((v: InicioSemana) => {
    updatePerfil({ preferencias: { ...preferencias, inicioSemana: v } });
  }, [preferencias, updatePerfil]);

  const setTema = useCallback((v: Tema) => {
    updatePerfil({ preferencias: { ...preferencias, tema: v } });
  }, [preferencias, updatePerfil]);

  const setIdioma = useCallback((v: Idioma) => {
    updatePerfil({ preferencias: { ...preferencias, idioma: v } });
  }, [preferencias, updatePerfil]);

  const setCoberturaModo = useCallback((v: CoberturaModo) => {
    updatePerfil({ preferencias: { ...preferencias, coberturaModo: v } });
  }, [preferencias, updatePerfil]);

  const setEspacioTrabajoId = useCallback((v: string) => {
    updatePerfil({ preferencias: { ...preferencias, espacioTrabajoId: v } });
  }, [preferencias, updatePerfil]);

  return {
    preferencias,
    setMoneda, setFormatoFecha, setInicioSemana, setTema, setIdioma, setCoberturaModo, setEspacioTrabajoId,
  };
}

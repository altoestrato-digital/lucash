"use client";

import { useCallback } from "react";
import { movimientosRepo } from "@/lib/db";
import { toIsoDateTime } from "@/lib/dates";
import type { Cartera } from "@/types/cartera";
import type { ISODateTime } from "@/lib/dates";

let conversionIdCounter = 1;
const genConversionId = () => `conv-${conversionIdCounter++}`;

export function useConversion() {
  const convertir = useCallback(
    (
      carteraOrigen: Cartera,
      carteraDestino: Cartera,
      montoOrigen: number,
      tasaUsdPorMoneda: number
    ) => {
      const conversionId = genConversionId();
      const fecha = toIsoDateTime(new Date());
      const montoUSD = montoOrigen * tasaUsdPorMoneda;
      const descripcion = `Conversión: ${carteraOrigen.nombre} → ${carteraDestino.nombre}`;

      movimientosRepo.addParConversion(
        {
          carteraId: carteraOrigen.id,
          tipo: "conversion-salida",
          monto: montoOrigen,
          conversionId,
          carteraContraparteId: carteraDestino.id,
          tasaUsdPorMoneda,
          fecha,
          descripcion,
        },
        {
          carteraId: carteraDestino.id,
          tipo: "conversion-entrada",
          monto: montoUSD,
          conversionId,
          carteraContraparteId: carteraOrigen.id,
          tasaUsdPorMoneda,
          fecha,
          descripcion,
        }
      );
    },
    []
  );

  const transferir = useCallback(
    (
      carteraOrigen: Cartera,
      carteraDestino: Cartera,
      data: {
        montoOrigen: number;
        montoDestino: number;
        comisionOrigen: number;
        comisionDestino: number;
        tasaResultante: number;
        fecha: ISODateTime;
      }
    ) => {
      const conversionId = genConversionId();
      const descripcion = `Transferencia: ${carteraOrigen.nombre} → ${carteraDestino.nombre}`;

      movimientosRepo.addParConversion(
        {
          carteraId: carteraOrigen.id,
          tipo: "conversion-salida",
          monto: data.montoOrigen,
          conversionId,
          carteraContraparteId: carteraDestino.id,
          tasaUsdPorMoneda: data.tasaResultante,
          fecha: data.fecha,
          descripcion,
        },
        {
          carteraId: carteraDestino.id,
          tipo: "conversion-entrada",
          monto: data.montoDestino,
          conversionId,
          carteraContraparteId: carteraOrigen.id,
          tasaUsdPorMoneda: data.tasaResultante,
          fecha: data.fecha,
          descripcion,
        }
      );
    },
    []
  );

  return { convertir, transferir };
}

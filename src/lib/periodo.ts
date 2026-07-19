import type { Presupuesto } from "@/types/presupuesto";
import type { ISODate } from "@/lib/dates";
import { calcularRangoPeriodo } from "@/lib/presupuesto-fechas";
import { getMonthName } from "@/lib/dates";

export const getRangoPorPresupuesto = (p: Presupuesto): { desde: ISODate; hasta: ISODate } => {
  const r = calcularRangoPeriodo(new Date(p.fechaInicio + "T12:00:00"), p.periodicidad, p.quincenaCorteDia);
  return { desde: r.fechaInicio, hasta: r.fechaFin };
};

export const etiquetaRango = (p: Presupuesto): string => {
  const { desde, hasta } = getRangoPorPresupuesto(p);
  const desdeD = new Date(desde + "T12:00:00");
  const hastaD = new Date(hasta + "T12:00:00");

  if (desde === hasta) return `Hoy (${desde})`;

  const desdeNum = desdeD.getDate();
  const hastaNum = hastaD.getDate();
  const desdeMes = getMonthName(desde);
  const hastaMes = getMonthName(hasta);

  if (desdeMes === hastaMes) {
    return `${desdeNum} – ${hastaNum} ${hastaMes} ${hastaD.getFullYear()}`;
  }
  return `${desdeNum} ${desdeMes} – ${hastaNum} ${hastaMes} ${hastaD.getFullYear()}`;
};

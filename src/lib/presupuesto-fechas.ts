import type { Periodicidad } from "@/types/presupuesto";
import type { ISODate } from "@/lib/dates";
import { toIso } from "@/lib/dates";

export const calcularRangoPeriodo = (
  desde: Date,
  periodicidad: Periodicidad,
  quincenaCorteDia?: 1 | 16
): { fechaInicio: ISODate; fechaFin: ISODate } => {
  const d = new Date(desde);

  switch (periodicidad) {
    case "diaria":
      return { fechaInicio: toIso(d), fechaFin: toIso(d) };
    case "semanal": {
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const lunes = new Date(d);
      lunes.setDate(diff);
      const domingo = new Date(lunes);
      domingo.setDate(lunes.getDate() + 6);
      return { fechaInicio: toIso(lunes), fechaFin: toIso(domingo) };
    }
    case "quincenal": {
      const corte = quincenaCorteDia ?? 1;
      const dia = d.getDate();
      let inicio: Date, fin: Date;
      if (dia < 16) {
        inicio = new Date(d.getFullYear(), d.getMonth(), corte);
        fin = new Date(d.getFullYear(), d.getMonth(), 15);
      } else {
        inicio = new Date(d.getFullYear(), d.getMonth(), 16);
        fin = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      }
      return { fechaInicio: toIso(inicio), fechaFin: toIso(fin) };
    }
    case "mensual":
      return {
        fechaInicio: toIso(new Date(d.getFullYear(), d.getMonth(), 1)),
        fechaFin: toIso(new Date(d.getFullYear(), d.getMonth() + 1, 0)),
      };
    case "trimestral": {
      const trimestre = Math.floor(d.getMonth() / 3);
      return {
        fechaInicio: toIso(new Date(d.getFullYear(), trimestre * 3, 1)),
        fechaFin: toIso(new Date(d.getFullYear(), trimestre * 3 + 3, 0)),
      };
    }
  }
};

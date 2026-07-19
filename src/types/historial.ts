import type { ISODate } from "@/lib/dates";
import type { TipoTransaccion, SubpresupuestoId } from "@/types/transaccion";
import type { Money } from "@/lib/money";

export type Periodo =
  | { tipo: "presupuesto" }
  | { tipo: "rango"; desde?: ISODate; hasta?: ISODate }
  | { tipo: "todas" };

export interface FiltroHistorial {
  periodo: Periodo;
  tipo: "todos" | TipoTransaccion;
  subPresupuestoId: "todos" | "general" | SubpresupuestoId;
  carteraId: "todos" | string;
}

export interface ResumenHistorial {
  ingresosBs: Money;
  egresosBs: Money;
  balanceBs: Money;
  ingresosUsd: Money;
  egresosUsd: Money;
  balanceUsd: Money;
  cantidad: number;
}

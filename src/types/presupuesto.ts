import type { Money } from "@/lib/money";
import type { ISODate } from "@/lib/dates";
import type { SubpresupuestoId } from "@/types/transaccion";

export type Periodicidad = "diaria" | "semanal" | "quincenal" | "mensual" | "trimestral";
export type Prioridad = 1 | 2 | 3;
export type EstadoCobertura = "cubierto" | "parcial" | "no-cubierto" | "excedido";
export type MonedaBudget = "Bs" | "USD";

export interface Subpresupuesto {
  id: SubpresupuestoId;
  nombre: string;
  color: string;
  limite: Money;
  limiteMoneda: MonedaBudget;
  prioridad: Prioridad;
  recurrente: boolean;
  orden: number;
  activo: boolean;
}

export interface Presupuesto {
  id: string;
  usuarioId: string;
  nombre: "Presupuesto general";
  periodicidad: Periodicidad;
  ingresoEsperado: Money;
  ingresoEsperadoMoneda: MonedaBudget;
  gastoMaximoEsperado: Money;
  gastoMaximoEsperadoMoneda: MonedaBudget;
  fechaInicio: ISODate;
  fechaFin: ISODate;
  quincenaCorteDia?: 1 | 16;
  subpresupuestos: Subpresupuesto[];
  createdAt: string;
  updatedAt: string;
  cerradoAt?: string;
}

export interface PresupuestoSnapshot {
  id: string;
  presupuestoIdOrigen: string;
  periodicidad: Periodicidad;
  fechaInicio: ISODate;
  fechaFin: ISODate;
  ingresoEsperado: Money;
  ingresoEsperadoMoneda: MonedaBudget;
  ingresoRealBs: Money;
  gastoMaximoEsperado: Money;
  gastoMaximoEsperadoMoneda: MonedaBudget;
  subpresupuestos: Subpresupuesto[];
  transaccionesIds: string[];
  balanceBs: Money;
  createdAt: string;
  updatedAt: string;
}

export interface CoberturaSub {
  subpresupuestoId: SubpresupuestoId | "otros";
  nombre: string;
  color: string;
  limiteBs: Money;
  limiteOriginal: Money;
  limiteMoneda: MonedaBudget;
  gastadoBs: Money;
  estado: EstadoCobertura;
  faltanBs: Money;
  excedidoBs: Money;
  prioridad?: Prioridad;
}

export interface AlertaCobertura {
  tipo: "sobregiro" | "basico" | "p2" | "p3" | "excedido" | "todo-cubierto";
  prioridad: number | null;
  mensaje: string;
}

export interface ResumenCobertura {
  ingresoEsperadoBs: Money;
  ingresoEsperadoMoneda: MonedaBudget;
  ingresoRealBs: Money;
  gastoMaximoEsperadoBs: Money;
  gastoMaximoEsperadoMoneda: MonedaBudget;
  gastoTotalBs: Money;
  balanceBs: Money;
  subCubiertos: number;
  totalSubs: number;
  porSub: CoberturaSub[];
  estadoGlobal: "sobregiro" | "falta-p1" | "falta-p2" | "falta-p3" | "todo-cubierto";
  mensaje: string;
  alertas: AlertaCobertura[];
}

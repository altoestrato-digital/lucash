import type { Money } from "@/lib/money";
import type { ISODate } from "@/lib/dates";
import type { CategoriaId, CategoriaDetalleId } from "@/types/transaccion";
import type { HexColor } from "@/types/hex-color";
import type { EspacioTrabajoId } from "@/types/espacio-trabajo";

export type Periodicidad = "semanal" | "quincenal" | "mensual" | "trimestral" | "rango";
export type Prioridad = 1 | 2 | 3;
export type EstadoCobertura = "cubierto" | "parcial" | "no-cubierto" | "excedido";
export type MonedaBudget = "Bs" | "USD";

export interface CategoriaDetalle {
  id: CategoriaDetalleId;
  categoriaId: CategoriaId;
  nombre: string;
  montoEstimado: Money;
  moneda: MonedaBudget;
  orden: number;
  color: HexColor;
  activo: boolean;
}

export interface Categoria {
  id: CategoriaId;
  presupuestoId: string;
  nombre: string;
  color: HexColor;
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
  espacioTrabajoId?: EspacioTrabajoId;
  nombre: "Presupuesto general";
  periodicidad: Periodicidad;
  ingresoEsperado: Money;
  ingresoEsperadoMoneda: MonedaBudget;
  gastoMaximoEsperado: Money;
  gastoMaximoEsperadoMoneda: MonedaBudget;
  fechaInicio: ISODate;
  fechaFin: ISODate;
  quincenaCorteDia?: 1 | 16;
  persistente?: boolean;
  categorias: Categoria[];
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
  categorias: Categoria[];
  transaccionesIds: string[];
  balanceBs: Money;
  createdAt: string;
  updatedAt: string;
}

export interface CoberturaCategoria {
  categoriaId: CategoriaId | "otros";
  nombre: string;
  color: HexColor;
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
  id: string;
  tipo: "sobregiro" | "basico" | "p2" | "p3" | "excedido" | "todo-cubierto";
  prioridad: number | null;
  montoBs: Money;
  monedaDefault: MonedaBudget;
  excedidoBs?: Money;
  faltanBs?: Money;
  categoriaNombres: string[];
}

export interface ResumenCobertura {
  ingresoEsperadoBs: Money;
  ingresoEsperadoMoneda: MonedaBudget;
  ingresoRealBs: Money;
  ingresoRealUsd: Money;
  gastoMaximoEsperadoBs: Money;
  gastoMaximoEsperadoMoneda: MonedaBudget;
  gastoTotalBs: Money;
  gastoTotalUsd: Money;
  balanceBs: Money;
  balanceUsd: Money;
  catCubiertas: number;
  totalCats: number;
  porCat: CoberturaCategoria[];
  estadoGlobal: "sobregiro" | "falta-p1" | "falta-p2" | "falta-p3" | "todo-cubierto";
  mensaje: string;
  alertas: AlertaCobertura[];
}

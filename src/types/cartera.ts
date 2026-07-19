import type { Money } from "@/lib/money";
import type { ISODate, ISODateTime } from "@/lib/dates";

export type CarteraId = string & { readonly __brand: "CarteraId" };
export type MetaCarteraId = string & { readonly __brand: "MetaCarteraId" };
export type MovimientoCarteraId = string & { readonly __brand: "MovimientoCarteraId" };

export type TipoCartera = "efectivo" | "banco" | "prepago" | "crypto" | "inversion";
export type Moneda = "Bs" | "USD" | "USDT" | "BTC" | "ETH";
export type ObjetivoCartera = "cubrir-presupuesto" | "ahorro";
export type TipoMovimientoCartera = "conversion-salida" | "conversion-entrada" | "ajuste";

export interface Cartera {
  id: CarteraId;
  usuarioId: string;
  nombre: string;
  tipo: TipoCartera;
  moneda: Moneda;
  saldo: number;
  objetivo: ObjetivoCartera;
  color: string;
  activo: boolean;
  espacioTrabajoId?: string;
  createdAt: string;
  updatedAt: string;
}

export type CarteraInput = Omit<Cartera, "id" | "usuarioId" | "createdAt" | "updatedAt">;

export interface MetaCartera {
  id: MetaCarteraId;
  carteraId: CarteraId;
  nombre: string;
  montoObjetivo: number;
  fechaMeta?: ISODate;
  notas?: string;
  cumplidaAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type MetaCarteraFormData = Omit<MetaCartera, "id" | "carteraId" | "cumplidaAt" | "createdAt" | "updatedAt">;
export type MetaCarteraInput = MetaCarteraFormData & { carteraId: CarteraId };

export interface MovimientoCartera {
  id: MovimientoCarteraId;
  carteraId: CarteraId;
  tipo: TipoMovimientoCartera;
  monto: number;
  monedaCartera: Moneda;
  saldoPrevio: number;
  saldoPosterior: number;
  conversionId?: string;
  carteraContraparteId?: CarteraId;
  tasaUsdPorMoneda?: number;
  fecha: ISODateTime;
  descripcion?: string;
  esRedireccionExcedente?: boolean;
  transaccionOrigenId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResumenCarteras {
  totalBs: Money;
  totalUsd: Money;
  disponibleBs: Money;
  disponibleUsd: Money;
  ahorroBs: Money;
  ahorroUsd: Money;
  cantidad: number;
  porTipo: Record<TipoCartera, number>;
}

export const esLiquida = (c: Cartera): boolean =>
  c.tipo === "efectivo" || c.tipo === "banco" || c.tipo === "prepago";

export const MONEDAS_POR_TIPO: Record<TipoCartera, Moneda[]> = {
  efectivo: ["Bs", "USD"],
  banco: ["Bs", "USD"],
  prepago: ["Bs", "USD"],
  crypto: ["USDT", "BTC", "ETH"],
  inversion: ["USDT", "BTC", "ETH"],
};

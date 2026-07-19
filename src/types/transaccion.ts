import type { Money } from "@/lib/money";
import type { ISODateTime } from "@/lib/dates";
import type { CarteraId, Moneda } from "@/types/cartera";

export type TipoTransaccion = "ingreso" | "egreso";
export type SubpresupuestoId = string & { readonly __brand: "SubpresupuestoId" };

export interface Adjunto {
  id: string;
  nombreArchivo: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp" | "application/pdf";
  dataUrl: string;
  tamanoBytes: number;
}

export interface Transaccion {
  id: string;
  tipo: TipoTransaccion;
  fecha: ISODateTime;
  emisorReceptor: string;
  concepto: string;
  montoOriginal: number;
  monedaOriginal: Moneda;
  montoBs: Money;
  montoUsd: Money;
  tasaOficial: number;
  tasaParalelo: number;
  carteraId: CarteraId;
  saldoPrevio: number;
  saldoPosterior: number;
  descripcion?: string;
  subPresupuestoId: SubpresupuestoId | null;
  adjunto?: Adjunto;
  createdAt: string;
  updatedAt: string;
  fuenteOcr: boolean;
  usoAhorroConfirmado?: boolean;
  esRedireccionExcedente?: boolean;
}

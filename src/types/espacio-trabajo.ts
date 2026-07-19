import type { Moneda } from "@/types/cartera";

export type EspacioTrabajoId = string & { readonly __brand: "EspacioTrabajoId" };

export interface EspacioTrabajo {
  id: EspacioTrabajoId;
  nombre: string;
  esDefault: boolean;
  monedaDefault: Moneda;
  createdAt: string;
}

export type EspacioTrabajoInput = Omit<EspacioTrabajo, "id" | "createdAt">;

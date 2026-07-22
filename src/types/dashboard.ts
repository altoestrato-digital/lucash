import type { Money } from "@/lib/money";
import type { Transaccion } from "@/types/transaccion";

export interface DashboardData {
  disponible: { bs: Money; usd: Money };
  presupuestoCubiertoPct: number;
  ingresoMesBs: Money;
  ingresoMesUsd: Money;
  gastadoMesBs: Money;
  gastadoMesUsd: Money;
  balanceMesBs: Money;
  balanceMesUsd: Money;
  gastosPorCat: {
    categoriaId: string;
    nombre: string;
    color: string;
    gastadoBs: Money;
    gastadoUsd: Money;
    porcentaje: number;
  }[];
  ultimasTransacciones: Transaccion[];
}

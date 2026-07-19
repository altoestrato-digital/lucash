import type { Money } from "@/lib/money";
import type { Transaccion } from "@/types/transaccion";

export interface DashboardData {
  disponible: { bs: Money; usd: Money };
  presupuestoCubiertoPct: number;
  gastadoMesBs: Money;
  gastosPorSub: {
    subpresupuestoId: string;
    nombre: string;
    color: string;
    gastadoBs: Money;
    porcentaje: number;
  }[];
  ultimasTransacciones: Transaccion[];
}

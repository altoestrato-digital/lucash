import type { Presupuesto, ResumenCobertura, CoberturaCategoria, MonedaBudget, AlertaCobertura } from "@/types/presupuesto";
import type { Transaccion } from "@/types/transaccion";
import type { Money } from "@/lib/money";
import { sum, sub, bs } from "@/lib/money";
import { convertirAUSD, convertirABs } from "@/lib/conversion";
import { toIso } from "@/lib/dates";

const toBs = (monto: number, moneda: MonedaBudget): number => {
  if (moneda === "Bs") return monto;
  const usdValue = convertirAUSD(monto, "USD", toIso(new Date()));
  return Number(convertirABs(usdValue, toIso(new Date())));
};

const fmtAmount = (value: Money, monedaPreferida: "Bs" | "USD"): string => {
  if (monedaPreferida === "USD") {
    const usdEq = convertirAUSD(Number(value), "Bs", toIso(new Date()));
    return `USD ${Number(usdEq).toFixed(2)}`;
  }
  return `Bs ${Number(value).toFixed(2)}`;
};

export const calcularCobertura = (
  p: Presupuesto,
  txs: Transaccion[],
  disponibleCarteras?: Money,
  monedaPreferida: "Bs" | "USD" = "Bs"
): ResumenCobertura => {
  const hoy = toIso(new Date());

  const ingresoRealBs = txs
    .filter((t) => t.tipo === "ingreso")
    .reduce((acc, t) => sum(acc, t.montoBs), bs(0));

  const gastoTotalBs = txs
    .filter((t) => t.tipo === "egreso")
    .reduce((acc, t) => sum(acc, t.montoBs), bs(0));

  const balanceBs = sub(ingresoRealBs, gastoTotalBs);

  const disponibleBs = disponibleCarteras ?? balanceBs;

  const activos = p.categorias.filter((s) => s.activo).sort((a, b) => a.prioridad - b.prioridad || a.orden - b.orden);

  const porCat: CoberturaCategoria[] = [];
  let catCubiertas = 0;

  for (const s of activos) {
    const gastadoBs = txs
      .filter((t) => t.tipo === "egreso" && t.categoriaId === s.id)
      .reduce((acc, t) => sum(acc, t.montoBs), bs(0));

    const limiteBsValue = toBs(Number(s.limite), s.limiteMoneda);

    let estado: CoberturaCategoria["estado"];
    const ingresoReal = Number(ingresoRealBs);
    if (Number(gastadoBs) > limiteBsValue) {
      estado = "excedido";
    } else if (ingresoReal >= limiteBsValue) {
      estado = "cubierto";
    } else if (ingresoReal >= Number(gastadoBs)) {
      estado = "parcial";
    } else {
      estado = "no-cubierto";
    }

    if (estado === "cubierto" || estado === "parcial") catCubiertas++;

    const faltanBs = bs(Math.max(0, limiteBsValue - Number(gastadoBs)));
    const excedidoBs = bs(Math.max(0, Number(gastadoBs) - limiteBsValue));

    porCat.push({
      categoriaId: s.id,
      nombre: s.nombre,
      color: s.color,
      limiteBs: bs(limiteBsValue),
      limiteOriginal: s.limite,
      limiteMoneda: s.limiteMoneda,
      gastadoBs,
      estado,
      faltanBs,
      excedidoBs,
      prioridad: s.prioridad,
    });
  }

  const gastoMaximoBs = toBs(Number(p.gastoMaximoEsperado), p.gastoMaximoEsperadoMoneda);
  const ingresoEsperadoBs = toBs(Number(p.ingresoEsperado), p.ingresoEsperadoMoneda);

  const totalLimitesBs = activos.reduce((acc, s) => acc + toBs(Number(s.limite), s.limiteMoneda), 0);
  const excedidoMaximo = totalLimitesBs > gastoMaximoBs;

  let estadoGlobal: ResumenCobertura["estadoGlobal"] = "todo-cubierto";
  let mensaje = "";
  const alertas: AlertaCobertura[] = [];

  if (excedidoMaximo) {
    estadoGlobal = "sobregiro";
    const exceso = totalLimitesBs - gastoMaximoBs;
    const excesoFormateado = p.gastoMaximoEsperadoMoneda === "USD"
      ? `USD ${(exceso / Number(convertirABs(bs(1), hoy))).toFixed(2)}`
      : `Bs ${exceso.toFixed(2)}`;
    mensaje = `Las categorías exceden el gasto máximo esperado por ${excesoFormateado}.`;
    alertas.push({ tipo: "excedido", prioridad: null, mensaje });
  } else if (Number(disponibleBs) < 0) {
    estadoGlobal = "sobregiro";
    mensaje = `Estás gastando más de lo que tienes. Te pasaste por ${fmtAmount(bs(Math.abs(Number(disponibleBs))), monedaPreferida)}.`;
    alertas.push({ tipo: "sobregiro", prioridad: null, mensaje });
  } else {
    const p1NoCubiertas = porCat.filter(
      (pc) => (pc.estado === "no-cubierto" || pc.estado === "excedido") && pc.prioridad === 1
    );
    const p2NoCubiertas = porCat.filter(
      (pc) => (pc.estado === "no-cubierto" || pc.estado === "excedido") && pc.prioridad === 2
    );
    const p3NoCubiertas = porCat.filter(
      (pc) => (pc.estado === "no-cubierto" || pc.estado === "excedido") && pc.prioridad === 3
    );

    function buildMensaje(cats: typeof p1NoCubiertas): string {
      const excedidos = cats.filter((pc) => pc.estado === "excedido");
      const faltantes = cats.filter((pc) => pc.estado !== "excedido");
      const partes: string[] = [];
      if (excedidos.length > 0) {
        const total = excedidos.reduce((acc, pc) => sum(acc, pc.excedidoBs), bs(0));
        const nombres = excedidos.map((pc) => pc.nombre).join(", ");
        partes.push(`Te excediste por ${fmtAmount(total, monedaPreferida)} en ${nombres}`);
      }
      if (faltantes.length > 0) {
        const total = faltantes.reduce((acc, pc) => sum(acc, pc.faltanBs), bs(0));
        const nombres = faltantes.map((pc) => pc.nombre).join(", ");
        partes.push(`Te faltan ${fmtAmount(total, monedaPreferida)} para cubrir ${nombres}`);
      }
      return partes.join(". ") + ".";
    }

    if (p1NoCubiertas.length > 0) {
      estadoGlobal = "falta-p1";
      mensaje = buildMensaje(p1NoCubiertas);
      alertas.push({ tipo: "basico", prioridad: 1, mensaje });
    }

    if (p2NoCubiertas.length > 0) {
      mensaje = buildMensaje(p2NoCubiertas);
      alertas.push({ tipo: "p2", prioridad: 2, mensaje });
    }

    if (p3NoCubiertas.length > 0) {
      mensaje = buildMensaje(p3NoCubiertas);
      alertas.push({ tipo: "p3", prioridad: 3, mensaje });
    }

    if (alertas.length === 0) {
      estadoGlobal = "todo-cubierto";
      const sobrante = bs(Math.max(0, Number(disponibleBs) - totalLimitesBs));
      mensaje = `Presupuesto cubierto. Sobran ${fmtAmount(sobrante, monedaPreferida)}.`;
      alertas.push({ tipo: "todo-cubierto", prioridad: null, mensaje });
    } else if (!p1NoCubiertas.length) {
      if (p2NoCubiertas.length > 0) {
        estadoGlobal = "falta-p2";
      } else if (p3NoCubiertas.length > 0) {
        estadoGlobal = "falta-p3";
      }
    }
  }

  return {
    ingresoEsperadoBs: bs(ingresoEsperadoBs),
    ingresoEsperadoMoneda: p.ingresoEsperadoMoneda,
    ingresoRealBs,
    gastoMaximoEsperadoBs: bs(gastoMaximoBs),
    gastoMaximoEsperadoMoneda: p.gastoMaximoEsperadoMoneda,
    gastoTotalBs,
    balanceBs,
    catCubiertas,
    totalCats: activos.length,
    porCat,
    estadoGlobal,
    mensaje,
    alertas,
  };
};

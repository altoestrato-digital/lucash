import type { Presupuesto, ResumenCobertura, CoberturaCategoria, AlertaCobertura } from "@/types/presupuesto";
import type { Transaccion } from "@/types/transaccion";
import type { Money } from "@/lib/money";
import { sum, sub, bs } from "@/lib/money";
import { toBs } from "@/lib/conversion";
import { toIso } from "@/lib/dates";

export const calcularCobertura = (
  p: Presupuesto,
  txs: Transaccion[],
  disponibleCarteras?: Money,
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

    const limiteBsValue = toBs(Number(s.limite), s.limiteMoneda, hoy);

    let estado: CoberturaCategoria["estado"];
    const ingresoReal = Number(ingresoRealBs);
    if (Number(gastadoBs) > limiteBsValue) {
      estado = "excedido";
    } else if (limiteBsValue > 0 && ingresoReal >= limiteBsValue) {
      estado = "cubierto";
    } else if (ingresoReal > 0 && ingresoReal >= Number(gastadoBs)) {
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

  const gastoMaximoBs = toBs(Number(p.gastoMaximoEsperado), p.gastoMaximoEsperadoMoneda, hoy);
  const ingresoEsperadoBs = toBs(Number(p.ingresoEsperado), p.ingresoEsperadoMoneda, hoy);

  const totalLimitesBs = activos.reduce((acc, s) => acc + toBs(Number(s.limite), s.limiteMoneda, hoy), 0);
  const excedidoMaximo = totalLimitesBs > gastoMaximoBs;

  let estadoGlobal: ResumenCobertura["estadoGlobal"] = "todo-cubierto";
  const alertas: AlertaCobertura[] = [];
  let alertaId = 0;
  const nextId = () => `alerta-${alertaId++}`;

  if (excedidoMaximo) {
    estadoGlobal = "sobregiro";
    const exceso = bs(totalLimitesBs - gastoMaximoBs);
    alertas.push({
      id: nextId(),
      tipo: "excedido",
      prioridad: null,
      montoBs: exceso,
      monedaDefault: p.gastoMaximoEsperadoMoneda,
      categoriaNombres: [],
    });
  } else if (Number(disponibleBs) < 0) {
    estadoGlobal = "sobregiro";
    alertas.push({
      id: nextId(),
      tipo: "sobregiro",
      prioridad: null,
      montoBs: bs(Math.abs(Number(disponibleBs))),
      monedaDefault: "Bs",
      categoriaNombres: [],
    });
  } else {
    const isRealGap = (pc: CoberturaCategoria) =>
      Number(pc.faltanBs) > 0 || Number(pc.excedidoBs) > 0;
    const p1NoCubiertas = porCat.filter(
      (pc) => (pc.estado === "no-cubierto" || pc.estado === "excedido") && pc.prioridad === 1 && isRealGap(pc)
    );
    const p2NoCubiertas = porCat.filter(
      (pc) => (pc.estado === "no-cubierto" || pc.estado === "excedido") && pc.prioridad === 2 && isRealGap(pc)
    );
    const p3NoCubiertas = porCat.filter(
      (pc) => (pc.estado === "no-cubierto" || pc.estado === "excedido") && pc.prioridad === 3 && isRealGap(pc)
    );

    const buildAlerta = (
      cats: typeof p1NoCubiertas,
      tipo: "basico" | "p2" | "p3",
      prioridad: 1 | 2 | 3,
    ): AlertaCobertura => {
      const excedidos = cats.filter((pc) => pc.estado === "excedido");
      const faltantes = cats.filter((pc) => pc.estado !== "excedido");
      const excedidoTotal = excedidos.length > 0
        ? excedidos.reduce((acc, pc) => sum(acc, pc.excedidoBs), bs(0))
        : undefined;
      const faltanTotal = faltantes.length > 0
        ? faltantes.reduce((acc, pc) => sum(acc, pc.faltanBs), bs(0))
        : undefined;
      const categoriaNombres = cats.map((pc) => pc.nombre);
      return {
        id: nextId(),
        tipo,
        prioridad,
        montoBs: excedidoTotal ?? faltanTotal ?? bs(0),
        monedaDefault: "Bs",
        excedidoBs: excedidoTotal,
        faltanBs: faltanTotal,
        categoriaNombres,
      };
    };

    if (p1NoCubiertas.length > 0) {
      estadoGlobal = "falta-p1";
      alertas.push(buildAlerta(p1NoCubiertas, "basico", 1));
    }

    if (p2NoCubiertas.length > 0) {
      alertas.push(buildAlerta(p2NoCubiertas, "p2", 2));
    }

    if (p3NoCubiertas.length > 0) {
      alertas.push(buildAlerta(p3NoCubiertas, "p3", 3));
    }

    if (alertas.length === 0) {
      // Solo emitimos "todo-cubierto" si hay actividad real: ingresos > 0
      // o categorías con gap. Si no hay nada, el presupuesto está vacío
      // y el banner queda en silencio.
      const tieneActividad = Number(ingresoRealBs) > 0
        || Number(gastoTotalBs) > 0
        || activos.length > 0;
      if (!tieneActividad) {
        estadoGlobal = "todo-cubierto";
      } else {
        estadoGlobal = "todo-cubierto";
        const sobrante = bs(Math.max(0, Number(disponibleBs) - totalLimitesBs));
        alertas.push({
          id: nextId(),
          tipo: "todo-cubierto",
          prioridad: null,
          montoBs: sobrante,
          monedaDefault: "Bs",
          categoriaNombres: [],
        });
      }
    } else if (!p1NoCubiertas.length) {
      if (p2NoCubiertas.length > 0) {
        estadoGlobal = "falta-p2";
      } else if (p3NoCubiertas.length > 0) {
        estadoGlobal = "falta-p3";
      }
    }
  }

  const mensajeGlobal = alertas[0]
    ? (estadoGlobal === "todo-cubierto"
        ? `Presupuesto cubierto. Sobran ${alertas[0].montoBs}.`
        : "")
    : "";

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
    mensaje: mensajeGlobal,
    alertas,
  };
};

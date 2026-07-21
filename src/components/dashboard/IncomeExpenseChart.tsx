"use client";

import { useState, useMemo } from "react";
import type { Transaccion } from "@/types/transaccion";
import type { Presupuesto } from "@/types/presupuesto";
import type { ISODate } from "@/lib/dates";
import { toIso, addDays, formatDateShort } from "@/lib/dates";
import { bs } from "@/lib/money";
import { TrendingUp } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useMonedaActiva, type UseMonedaActivaReturn } from "@/hooks/useMonedaActiva";

type Periodo = "presupuesto" | "dia" | "semana" | "quincena" | "mes" | "año" | "rango";

interface Props {
  transacciones: Transaccion[];
  presupuesto: Presupuesto | null;
}

const PERIODOS: { label: string; value: Periodo }[] = [
  { label: "Presupuesto", value: "presupuesto" },
  { label: "Día", value: "dia" },
  { label: "Semana", value: "semana" },
  { label: "Quincena", value: "quincena" },
  { label: "Mes", value: "mes" },
  { label: "Año", value: "año" },
  { label: "Rango", value: "rango" },
];

function getRango(periodo: Periodo, presupuesto: Presupuesto | null, rangoDesde: string, rangoHasta: string): { desde: string; hasta: string } {
  const hoy = toIso(new Date());
  if (periodo === "presupuesto" && presupuesto) {
    return { desde: presupuesto.fechaInicio, hasta: presupuesto.fechaFin };
  }
  if (periodo === "dia") {
    return { desde: hoy, hasta: hoy };
  }
  if (periodo === "semana") {
    const d = new Date(hoy + "T12:00:00");
    const dayOfWeek = d.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = addDays(hoy as ISODate, diffToMonday);
    return { desde: monday, hasta: hoy };
  }
  if (periodo === "quincena") {
    const d = new Date(hoy + "T12:00:00");
    const day = d.getDate();
    if (day <= 15) {
      const start = hoy.slice(0, 8) + "01";
      return { desde: start as ISODate, hasta: hoy };
    } else {
      const start = hoy.slice(0, 8) + "16";
      return { desde: start as ISODate, hasta: hoy };
    }
  }
  if (periodo === "mes") {
    const start = hoy.slice(0, 8) + "01";
    return { desde: start as ISODate, hasta: hoy };
  }
  if (periodo === "año") {
    const start = hoy.slice(0, 4) + "-01-01";
    return { desde: start as ISODate, hasta: hoy };
  }
  if (periodo === "rango") {
    return { desde: rangoDesde as ISODate, hasta: rangoHasta as ISODate };
  }
  return { desde: hoy, hasta: hoy };
}

function agruparPorFecha(
  txs: Transaccion[],
  desde: string,
  hasta: string,
  periodo: Periodo,
  moneda: "Bs" | "USD",
): { fecha: string; label: string; ingresos: number; egresos: number; ingresosBs: number; egresosBs: number; ingresosUsd: number; egresosUsd: number }[] {
  const desdeDate = new Date(desde + "T12:00:00");
  const hastaDate = new Date(hasta + "T12:00:00");
  const totalDias = Math.max(1, Math.round((hastaDate.getTime() - desdeDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  const buckets = new Map<string, { ingresos: number; egresos: number; ingresosBs: number; egresosBs: number; ingresosUsd: number; egresosUsd: number; order: number }>();

  const getMonto = (tx: Transaccion): [number, number, number] => {
    const bsVal = Number(tx.montoBs);
    const usdVal = Number(tx.montoUsd);
    if (moneda === "USD") return [usdVal, bsVal, usdVal];
    return [bsVal, bsVal, usdVal];
  };

  if (periodo === "dia") {
    for (let h = 0; h < 24; h++) {
      const hourKey = String(h).padStart(2, "0") + ":00";
      buckets.set(hourKey, { ingresos: 0, egresos: 0, ingresosBs: 0, egresosBs: 0, ingresosUsd: 0, egresosUsd: 0, order: h });
    }
    for (const tx of txs) {
      const horaMatch = tx.fecha.includes("T") ? tx.fecha.slice(11, 13) : null;
      const h = horaMatch ? parseInt(horaMatch, 10) : 12;
      const hourKey = String(h).padStart(2, "0") + ":00";
      const b = buckets.get(hourKey)!;
      const [monto, montoBs, montoUsd] = getMonto(tx);
      if (tx.tipo === "ingreso") { b.ingresos += monto; b.ingresosBs += montoBs; b.ingresosUsd += montoUsd; }
      else { b.egresos += monto; b.egresosBs += montoBs; b.egresosUsd += montoUsd; }
    }
    return Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => ({ fecha: key, label: key, ...val }));
  }

  if (periodo === "año" || totalDias > 60) {
    for (const tx of txs) {
      const monthKey = tx.fecha.slice(0, 7);
      if (!buckets.has(monthKey)) {
        buckets.set(monthKey, { ingresos: 0, egresos: 0, ingresosBs: 0, egresosBs: 0, ingresosUsd: 0, egresosUsd: 0, order: buckets.size });
      }
      const b = buckets.get(monthKey)!;
      const [monto, montoBs, montoUsd] = getMonto(tx);
      if (tx.tipo === "ingreso") { b.ingresos += monto; b.ingresosBs += montoBs; b.ingresosUsd += montoUsd; }
      else { b.egresos += monto; b.egresosBs += montoBs; b.egresosUsd += montoUsd; }
    }
    return Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => {
        const [y, m] = key.split("-");
        const monthNames = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
        return { fecha: key, label: `${monthNames[parseInt(m, 10) - 1]} ${y}`, ...val };
      });
  }

  if (periodo === "mes" || totalDias > 14) {
    const byWeek = new Map<string, { ingresos: number; egresos: number; ingresosBs: number; egresosBs: number; ingresosUsd: number; egresosUsd: number; order: number }>();
    for (const tx of txs) {
      const txDate = tx.fecha.includes("T") ? tx.fecha.slice(0, 10) : tx.fecha;
      const d = new Date(txDate + "T12:00:00");
      const dayOfWeek = d.getDay();
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = addDays(txDate as ISODate, diffToMonday);
      const weekKey = monday;
      if (!byWeek.has(weekKey)) {
        byWeek.set(weekKey, { ingresos: 0, egresos: 0, ingresosBs: 0, egresosBs: 0, ingresosUsd: 0, egresosUsd: 0, order: byWeek.size });
      }
      const b = byWeek.get(weekKey)!;
      const [monto, montoBs, montoUsd] = getMonto(tx);
      if (tx.tipo === "ingreso") { b.ingresos += monto; b.ingresosBs += montoBs; b.ingresosUsd += montoUsd; }
      else { b.egresos += monto; b.egresosBs += montoBs; b.egresosUsd += montoUsd; }
    }
    return Array.from(byWeek.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => ({ fecha: key, label: formatDateShort(key as ISODate), ...val }));
  }

  for (let d = new Date(desdeDate); d <= hastaDate; d.setDate(d.getDate() + 1)) {
    const iso = toIso(d);
    if (!buckets.has(iso)) {
      buckets.set(iso, { ingresos: 0, egresos: 0, ingresosBs: 0, egresosBs: 0, ingresosUsd: 0, egresosUsd: 0, order: buckets.size });
    }
  }
  for (const tx of txs) {
    const txDate = tx.fecha.includes("T") ? tx.fecha.slice(0, 10) : tx.fecha;
    if (!buckets.has(txDate)) {
      buckets.set(txDate, { ingresos: 0, egresos: 0, ingresosBs: 0, egresosBs: 0, ingresosUsd: 0, egresosUsd: 0, order: buckets.size });
    }
    const b = buckets.get(txDate)!;
    const [monto, montoBs, montoUsd] = getMonto(tx);
    if (tx.tipo === "ingreso") { b.ingresos += monto; b.ingresosBs += montoBs; b.ingresosUsd += montoUsd; }
    else { b.egresos += monto; b.egresosBs += montoBs; b.egresosUsd += montoUsd; }
  }
  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, val]) => ({ fecha: key, label: formatDateShort(key as ISODate), ...val }));
}

function CustomTooltip({ active, payload, label, formatPair }: { active?: boolean; payload?: Array<{ value: number; dataKey: string; payload: { ingresosBs?: number; egresosBs?: number; ingresosUsd?: number; egresosUsd?: number } }>; label?: string; formatPair: UseMonedaActivaReturn["formatPair"] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-surface-elevated border border-border px-4 py-3 shadow-xl">
      <p className="text-xs text-muted mb-2">{label}</p>
      {payload.map((p) => {
        const bsValue = p.dataKey === "ingresos" ? (p.payload.ingresosBs ?? p.value) : (p.payload.egresosBs ?? p.value);
        const usdValue = p.dataKey === "ingresos" ? (p.payload.ingresosUsd ?? 0) : (p.payload.egresosUsd ?? 0);
        const pair = formatPair(bs(bsValue), bs(usdValue));
        const color = p.dataKey === "ingresos" ? "text-emerald-500" : "text-rose-500";
        const icon = p.dataKey === "ingresos" ? "+" : "-";
        return (
          <div key={p.dataKey} className="flex items-center gap-2">
            <span className={`text-xs font-medium ${color}`}>{icon}</span>
            <p className={`text-sm font-bold ${color}`}>{pair.primary}</p>
            <p className="text-[10px] text-muted">{pair.secondary}</p>
          </div>
        );
      })}
    </div>
  );
}

export default function IncomeExpenseChart({ transacciones, presupuesto }: Props) {
  const { formatPair, moneda } = useMonedaActiva();
  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const [rangoDesde, setRangoDesde] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return toIso(d);
  });
  const [rangoHasta, setRangoHasta] = useState(() => toIso(new Date()));

  const formatTick = (v: number) => {
    const prefix = moneda === "USD" ? "$" : "Bs";
    if (v >= 1000) return `${prefix}${(v / 1000).toFixed(1)}k`;
    if (v >= 1) return `${prefix}${v.toFixed(0)}`;
    return `${prefix}0`;
  };

  const { desde, hasta } = getRango(periodo, presupuesto, rangoDesde, rangoHasta);

  const filtradas = useMemo(() => {
    if (periodo === "dia") {
      return transacciones.filter((tx) => tx.fecha.slice(0, 10) === desde);
    }
    return transacciones.filter((tx) => tx.fecha >= desde && tx.fecha <= hasta);
  }, [transacciones, desde, hasta, periodo]);

  const chartData = useMemo(
    () => agruparPorFecha(filtradas, desde, hasta, periodo, moneda),
    [filtradas, desde, hasta, periodo, moneda],
  );

  return (
    <div className="rounded-2xl bg-surface border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">Historial de ingresos y egresos</h3>
          <p className="text-xs text-muted mt-0.5">Evolución temporal</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
          <TrendingUp className="h-4 w-4 text-primary" />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {PERIODOS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriodo(p.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              periodo === p.value
                ? "bg-primary text-white"
                : "bg-surface-elevated text-muted hover:text-foreground"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {periodo === "rango" && (
        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <label className="text-[10px] text-muted uppercase">Desde</label>
            <input
              type="date"
              value={rangoDesde}
              onChange={(e) => setRangoDesde(e.target.value as ISODate)}
              className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-foreground"
            />
          </div>
          <div className="flex-1">
            <label className="text-[10px] text-muted uppercase">Hasta</label>
            <input
              type="date"
              value={rangoHasta}
              onChange={(e) => setRangoHasta(e.target.value as ISODate)}
              className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-foreground"
            />
          </div>
        </div>
      )}

      {chartData.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-sm text-muted">
          Sin transacciones en este período
        </div>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "var(--muted)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--muted)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={formatTick}
              />
              <Tooltip content={<CustomTooltip formatPair={formatPair} />} cursor={{ stroke: "var(--border)" }} wrapperStyle={{ backgroundColor: "transparent" }} />
              <Line
                type="monotone"
                dataKey="ingresos"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: "#10b981", strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
              />
              <Line
                type="monotone"
                dataKey="egresos"
                stroke="#f43f5e"
                strokeWidth={2}
                dot={{ fill: "#f43f5e", strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 flex gap-4">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <span className="text-xs text-muted">Ingresos</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
          <span className="text-xs text-muted">Egresos</span>
        </div>
      </div>
    </div>
  );
}

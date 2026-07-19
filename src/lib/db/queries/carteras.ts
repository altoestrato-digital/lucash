"use client";

import { getDB, persist, notifyChange, withTransaction, queryAll, queryOne } from "../client";
import type { Database } from "sql.js";
import type { ISODate, ISODateTime } from "@/lib/dates";
import type {
  Cartera,
  CarteraId,
  CarteraInput,
  MetaCartera,
  MetaCarteraId,
  MetaCarteraInput,
  MovimientoCartera,
  MovimientoCarteraId,
} from "@/types/cartera";
import { usuariosRepo } from "./usuario";

type Row = Record<string, unknown>;

function rowToCartera(row: Row): Cartera {
  return {
    id: row.id as CarteraId,
    usuarioId: (row.usuario_id as string) ?? usuariosRepo.getActivo().id,
    nombre: row.nombre as string,
    tipo: row.tipo as Cartera["tipo"],
    moneda: row.moneda as Cartera["moneda"],
    saldo: row.saldo as number,
    objetivo: row.objetivo as Cartera["objetivo"],
    color: row.color as string,
    activo: Boolean(row.activo),
    espacioTrabajoId: (row.espacio_trabajo_id as string | null) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToMeta(row: Row): MetaCartera {
  return {
    id: row.id as MetaCarteraId,
    carteraId: row.cartera_id as CarteraId,
    nombre: row.nombre as string,
    montoObjetivo: row.monto_objetivo as number,
    fechaMeta: ((row.fecha_meta as string | null) ?? undefined) as ISODate | undefined,
    notas: (row.notas as string | null) ?? undefined,
    cumplidaAt: (row.cumplida_at as string | null) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToMovimiento(row: Row): MovimientoCartera {
  return {
    id: row.id as MovimientoCarteraId,
    carteraId: row.cartera_id as CarteraId,
    tipo: row.tipo as MovimientoCartera["tipo"],
    monto: row.monto as number,
    monedaCartera: (row.moneda_cartera as MovimientoCartera["monedaCartera"]) ?? "Bs",
    saldoPrevio: (row.saldo_previo as number) ?? 0,
    saldoPosterior: (row.saldo_posterior as number) ?? 0,
    conversionId: ((row.conversion_id as string | null) ?? undefined) as MovimientoCartera["conversionId"],
    carteraContraparteId: ((row.cartera_contraparte_id as CarteraId | null) ?? undefined) as MovimientoCartera["carteraContraparteId"],
    tasaUsdPorMoneda: (row.tasa_usd_por_moneda as number | null) ?? undefined,
    fecha: row.fecha as ISODateTime,
    descripcion: (row.descripcion as string | null) ?? undefined,
    esRedireccionExcedente: Boolean(row.es_redireccion_excedente),
    transaccionOrigenId: (row.transaccion_origen_id as string | null) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

let idCounter = 1;
const genId = (prefix: string) => `${prefix}-${Date.now()}-${idCounter++}`;

function calcularSaldoEfectivo(carteraId: string): number {
  return queryOne(
    "SELECT saldo FROM cartera WHERE id = ?",
    [carteraId],
    (row) => (row.saldo as number) ?? 0,
  ) ?? 0;
}

function syncCarteraSaldo(carteraId: string, delta: number): void {
  const db = getDB();
  const now = new Date().toISOString();
  db.run("UPDATE cartera SET saldo = saldo + ?, updated_at = ? WHERE id = ?", [delta, now, carteraId]);
}

function leerMonedaCartera(db: Database, carteraId: string): MovimientoCartera["monedaCartera"] {
  const stmt = db.prepare("SELECT moneda FROM cartera WHERE id = ?");
  stmt.bind([carteraId]);
  let moneda: MovimientoCartera["monedaCartera"] = "Bs";
  if (stmt.step()) {
    moneda = (stmt.getAsObject().moneda as MovimientoCartera["monedaCartera"]) ?? "Bs";
  }
  stmt.free();
  return moneda;
}

export const carterasRepo = {
  list(): Cartera[] {
    return queryAll("SELECT * FROM cartera ORDER BY created_at", [], rowToCartera);
  },

  add(c: CarteraInput): Cartera {
    const now = new Date().toISOString();
    const usuarioId = usuariosRepo.getActivo().id;
    const nueva: Cartera = {
      ...c,
      usuarioId,
      id: genId("cartera") as CarteraId,
      createdAt: now,
      updatedAt: now,
    };
    const db = getDB();
    db.run(
      `INSERT INTO cartera (id, usuario_id, nombre, tipo, moneda, saldo, objetivo, color, activo, espacio_trabajo_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nueva.id,
        nueva.usuarioId,
        nueva.nombre,
        nueva.tipo,
        nueva.moneda,
        nueva.saldo,
        nueva.objetivo,
        nueva.color,
        nueva.activo ? 1 : 0,
        nueva.espacioTrabajoId ?? null,
        nueva.createdAt,
        nueva.updatedAt,
      ],
    );
    persist();
    notifyChange();
    return nueva;
  },

  update(id: CarteraId, data: Partial<Cartera>): void {
    const db = getDB();
    const current = carterasRepo.list().find((c) => c.id === id);
    if (!current) return;
    const merged = { ...current, ...data };
    const now = new Date().toISOString();
    db.run(
      `UPDATE cartera
       SET usuario_id = ?, nombre = ?, tipo = ?, moneda = ?, saldo = ?, objetivo = ?, color = ?, activo = ?, espacio_trabajo_id = ?, updated_at = ?
       WHERE id = ?`,
      [
        merged.usuarioId,
        merged.nombre,
        merged.tipo,
        merged.moneda,
        merged.saldo,
        merged.objetivo,
        merged.color,
        merged.activo ? 1 : 0,
        merged.espacioTrabajoId ?? null,
        now,
        id,
      ],
    );
    persist();
    notifyChange();
  },

  softDelete(id: CarteraId): void {
    const db = getDB();
    const now = new Date().toISOString();
    db.run("UPDATE cartera SET activo = 0, updated_at = ? WHERE id = ?", [now, id]);
    persist();
    notifyChange();
  },
};

export const metasRepo = {
  list(): MetaCartera[] {
    return queryAll("SELECT * FROM meta_cartera", [], rowToMeta);
  },

  add(m: MetaCarteraInput): MetaCartera {
    const now = new Date().toISOString();
    const nueva: MetaCartera = { ...m, id: genId("meta") as MetaCarteraId, createdAt: now, updatedAt: now };
    const db = getDB();
    db.run(
      `INSERT INTO meta_cartera (id, cartera_id, nombre, monto_objetivo, fecha_meta, notas, cumplida_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nueva.id,
        nueva.carteraId,
        nueva.nombre,
        nueva.montoObjetivo,
        nueva.fechaMeta ?? null,
        nueva.notas ?? null,
        nueva.cumplidaAt ?? null,
        nueva.createdAt,
        nueva.updatedAt,
      ],
    );
    persist();
    notifyChange();
    return nueva;
  },

  update(id: MetaCarteraId, data: Partial<MetaCartera>): void {
    const db = getDB();
    const current = metasRepo.list().find((m) => m.id === id);
    if (!current) return;
    const merged = { ...current, ...data };
    const now = new Date().toISOString();
    db.run(
      `UPDATE meta_cartera
       SET cartera_id = ?, nombre = ?, monto_objetivo = ?, fecha_meta = ?, notas = ?, cumplida_at = ?, updated_at = ?
       WHERE id = ?`,
      [
        merged.carteraId,
        merged.nombre,
        merged.montoObjetivo,
        merged.fechaMeta ?? null,
        merged.notas ?? null,
        merged.cumplidaAt ?? null,
        now,
        id,
      ],
    );
    persist();
    notifyChange();
  },

  delete(id: MetaCarteraId): void {
    const db = getDB();
    db.run("DELETE FROM meta_cartera WHERE id = ?", [id]);
    persist();
    notifyChange();
  },
};

type MovimientoDraft = Omit<MovimientoCartera, "id" | "createdAt" | "updatedAt" | "saldoPrevio" | "saldoPosterior" | "monedaCartera"> & {
  monedaCartera?: MovimientoCartera["monedaCartera"];
};

function insertMovimiento(db: Database, m: MovimientoDraft): MovimientoCartera {
  const monedaCartera = m.monedaCartera ?? leerMonedaCartera(db, m.carteraId);
  const saldoPrevio = calcularSaldoEfectivo(m.carteraId);
  const delta = m.tipo === "conversion-salida" ? -m.monto : m.monto;
  const saldoPosterior = saldoPrevio + delta;

  const now = new Date().toISOString();
  const created: MovimientoCartera = {
    ...m,
    id: genId("mov") as MovimientoCarteraId,
    monedaCartera,
    saldoPrevio,
    saldoPosterior,
    createdAt: now,
    updatedAt: now,
  };

  db.run(
    `INSERT INTO movimiento_cartera
     (id, cartera_id, tipo, monto, moneda_cartera, saldo_previo, saldo_posterior,
      conversion_id, cartera_contraparte_id, tasa_usd_por_moneda,
      fecha, descripcion, es_redireccion_excedente, transaccion_origen_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      created.id,
      created.carteraId,
      created.tipo,
      created.monto,
      created.monedaCartera,
      created.saldoPrevio,
      created.saldoPosterior,
      created.conversionId ?? null,
      created.carteraContraparteId ?? null,
      created.tasaUsdPorMoneda ?? null,
      created.fecha,
      created.descripcion ?? null,
      created.esRedireccionExcedente ? 1 : 0,
      created.transaccionOrigenId ?? null,
      created.createdAt,
      created.updatedAt,
    ],
  );
  syncCarteraSaldo(m.carteraId, delta);
  return created;
}

export const movimientosRepo = {
  list(): MovimientoCartera[] {
    return queryAll("SELECT * FROM movimiento_cartera ORDER BY created_at", [], rowToMovimiento);
  },

  calcularSaldo(carteraId: string): number {
    return calcularSaldoEfectivo(carteraId);
  },

  add(m: MovimientoDraft): MovimientoCartera {
    const nuevo = withTransaction(() => insertMovimiento(getDB(), m));
    persist();
    notifyChange();
    return nuevo;
  },

  addParConversion(salida: MovimientoDraft, entrada: MovimientoDraft): { salida: MovimientoCartera; entrada: MovimientoCartera } {
    const resultado = withTransaction(() => {
      const db = getDB();
      const s = insertMovimiento(db, salida);
      const e = insertMovimiento(db, entrada);
      return { salida: s, entrada: e };
    });
    persist();
    notifyChange();
    return resultado;
  },
};

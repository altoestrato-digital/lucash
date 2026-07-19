"use client";

import { getDB, persist, notifyChange, withTransaction, queryAll, queryOne } from "../client";
import type { Database } from "sql.js";
import type { ISODate } from "@/lib/dates";
import type { Money } from "@/lib/money";
import { bs } from "@/lib/money";
import type {
  MonedaBudget,
  Periodicidad,
  Presupuesto,
  PresupuestoSnapshot,
  Prioridad,
  Subpresupuesto,
} from "@/types/presupuesto";
import type { SubpresupuestoId } from "@/types/transaccion";
import { usuariosRepo } from "./usuario";

type Row = Record<string, unknown>;

function rowToSubpresupuesto(row: Row): Subpresupuesto {
  return {
    id: row.id as SubpresupuestoId,
    nombre: row.nombre as string,
    color: row.color as string,
    limite: bs(row.limite as number),
    limiteMoneda: (row.limite_moneda as MonedaBudget) ?? "Bs",
    prioridad: row.prioridad as Prioridad,
    recurrente: Boolean(row.recurrente),
    orden: row.orden as number,
    activo: Boolean(row.activo),
  };
}

function rowToPresupuesto(row: Row, subs: Subpresupuesto[]): Presupuesto {
  return {
    id: row.id as string,
    usuarioId: (row.usuario_id as string) ?? usuariosRepo.getActivo().id,
    nombre: row.nombre as "Presupuesto general",
    periodicidad: row.periodicidad as Periodicidad,
    ingresoEsperado: bs(row.ingreso_esperado as number),
    ingresoEsperadoMoneda: (row.ingreso_esperado_moneda as MonedaBudget) ?? "Bs",
    gastoMaximoEsperado: bs(row.gasto_maximo_esperado as number),
    gastoMaximoEsperadoMoneda: (row.gasto_maximo_esperado_moneda as MonedaBudget) ?? "Bs",
    fechaInicio: row.fecha_inicio as ISODate,
    fechaFin: row.fecha_fin as ISODate,
    quincenaCorteDia:
      (row.quincena_corte_dia as number | null) === null
        ? undefined
        : ((row.quincena_corte_dia as number) as 1 | 16),
    subpresupuestos: subs,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    cerradoAt: (row.cerrado_at as string | null) ?? undefined,
  };
}

let idCounter = 1;
const genId = (prefix: string) => `${prefix}-${Date.now()}-${idCounter++}`;

function subpresupuestosDe(presupuestoId: string): Subpresupuesto[] {
  return queryAll(
    "SELECT * FROM subpresupuesto WHERE presupuesto_id = ? ORDER BY prioridad, orden",
    [presupuestoId],
    rowToSubpresupuesto,
  );
}

function upsertPresupuestoCore(p: Omit<Presupuesto, "id" | "createdAt" | "updatedAt">, existingId?: string): Presupuesto {
  const db = getDB();
  const now = new Date().toISOString();
  const usuarioId = usuariosRepo.getActivo().id;
  if (existingId) {
    db.run(
      `UPDATE presupuesto
       SET usuario_id = ?, nombre = ?, periodicidad = ?,
           ingreso_esperado = ?, ingreso_esperado_moneda = ?,
           gasto_maximo_esperado = ?, gasto_maximo_esperado_moneda = ?,
           fecha_inicio = ?, fecha_fin = ?, quincena_corte_dia = ?,
           cerrado = 0, cerrado_at = NULL, updated_at = ?
       WHERE id = ?`,
      [
        usuarioId,
        p.nombre,
        p.periodicidad,
        Number(p.ingresoEsperado),
        p.ingresoEsperadoMoneda,
        Number(p.gastoMaximoEsperado),
        p.gastoMaximoEsperadoMoneda,
        p.fechaInicio,
        p.fechaFin,
        p.quincenaCorteDia ?? null,
        now,
        existingId,
      ],
    );
    return { ...p, usuarioId, id: existingId, createdAt: now, updatedAt: now, cerradoAt: undefined };
  }
  const id = genId("pres");
  const created: Presupuesto = {
    ...p,
    id,
    usuarioId,
    createdAt: now,
    updatedAt: now,
  };
  db.run(
    `INSERT INTO presupuesto
     (id, usuario_id, nombre, periodicidad,
      ingreso_esperado, ingreso_esperado_moneda,
      gasto_maximo_esperado, gasto_maximo_esperado_moneda,
      fecha_inicio, fecha_fin, quincena_corte_dia, cerrado, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
    [
      created.id,
      created.usuarioId,
      created.nombre,
      created.periodicidad,
      Number(created.ingresoEsperado),
      created.ingresoEsperadoMoneda,
      Number(created.gastoMaximoEsperado),
      created.gastoMaximoEsperadoMoneda,
      created.fechaInicio,
      created.fechaFin,
      created.quincenaCorteDia ?? null,
      created.createdAt,
      created.updatedAt,
    ],
  );
  return created;
}

export const presupuestoRepo = {
  getActual(): Presupuesto | null {
    const usuarioId = usuariosRepo.getActivo().id;
    return queryOne(
      "SELECT * FROM presupuesto WHERE cerrado = 0 AND usuario_id = ? ORDER BY created_at DESC LIMIT 1",
      [usuarioId],
      (row) => rowToPresupuesto(row, subpresupuestosDe(row.id as string)),
    );
  },

  upsert(p: Omit<Presupuesto, "id" | "createdAt" | "updatedAt">): Presupuesto {
    const existing = presupuestoRepo.getActual();
    const result = upsertPresupuestoCore(p, existing?.id);
    persist();
    notifyChange();
    return result;
  },

  cerrarPeriodo(id: string, cerradoAt: string): void {
    const db = getDB();
    const now = new Date().toISOString();
    db.run("UPDATE presupuesto SET cerrado = 1, cerrado_at = ?, updated_at = ? WHERE id = ?", [cerradoAt, now, id]);
    persist();
    notifyChange();
  },

  cerrarPeriodoConSnapshot(
    id: string,
    cerradoAt: string,
    snapshot: PresupuestoSnapshot,
    nuevo: Omit<Presupuesto, "id" | "createdAt" | "updatedAt">,
  ): Presupuesto {
    const result = withTransaction(() => {
      const db = getDB();
      const now = new Date().toISOString();

      // 1. Snapshot del período cerrado.
      db.run(
        `INSERT INTO snapshot_presupuesto (id, presupuesto_id, periodo_inicio, periodo_fin, data, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [snapshot.id, snapshot.presupuestoIdOrigen, snapshot.fechaInicio, snapshot.fechaFin, JSON.stringify(snapshot), snapshot.createdAt, now],
      );

      // 2. Cerrar período actual.
      db.run("UPDATE presupuesto SET cerrado = 1, cerrado_at = ?, updated_at = ? WHERE id = ?", [cerradoAt, now, id]);

      // 3. Crear período siguiente.
      return upsertPresupuestoCore(nuevo);
    });
    persist();
    notifyChange();
    return result;
  },
};

function shiftOrden(db: Database, presupuestoId: string, prioridad: number, desdeOrden: number) {
  const now = new Date().toISOString();
  db.run(
    `UPDATE subpresupuesto SET orden = orden + 1, updated_at = ? WHERE presupuesto_id = ? AND prioridad = ? AND orden >= ? AND activo = 1`,
    [now, presupuestoId, prioridad, desdeOrden],
  );
}

function unshiftOrden(db: Database, presupuestoId: string, prioridad: number, desdeOrden: number) {
  const now = new Date().toISOString();
  db.run(
    `UPDATE subpresupuesto SET orden = orden - 1, updated_at = ? WHERE presupuesto_id = ? AND prioridad = ? AND orden > ? AND activo = 1`,
    [now, presupuestoId, prioridad, desdeOrden],
  );
}

export const subpresupuestosRepo = {
  list(presupuestoId: string): Subpresupuesto[] {
    return subpresupuestosDe(presupuestoId);
  },

  add(s: Omit<Subpresupuesto, "id"> & { presupuestoId: string }): Subpresupuesto {
    const created = withTransaction(() => {
      const id = genId("sub") as SubpresupuestoId;
      const creada: Subpresupuesto = { ...s, id };
      const now = new Date().toISOString();
      const db = getDB();
      shiftOrden(db, s.presupuestoId, creada.prioridad, creada.orden);
      db.run(
        `INSERT INTO subpresupuesto
         (id, presupuesto_id, nombre, color, limite, limite_moneda, prioridad, recurrente, orden, activo, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        [
          creada.id,
          s.presupuestoId,
          creada.nombre,
          creada.color,
          Number(creada.limite),
          creada.limiteMoneda,
          creada.prioridad,
          creada.recurrente ? 1 : 0,
          creada.orden,
          now,
          now,
        ],
      );
      return creada;
    });
    persist();
    notifyChange();
    return created;
  },

  update(id: SubpresupuestoId, data: Partial<Subpresupuesto>): void {
    const db = getDB();
    const stmt = db.prepare("SELECT * FROM subpresupuesto WHERE id = ?");
    stmt.bind([id]);
    if (!stmt.step()) {
      stmt.free();
      return;
    }
    const rawRow = stmt.getAsObject();
    const current = rowToSubpresupuesto(rawRow);
    const presupuestoId = rawRow.presupuesto_id as string;
    stmt.free();
    const merged = { ...current, ...data };

    withTransaction(() => {
      // Reorder if priority or orden changed
      const oldPrioridad = current.prioridad;
      const newPrioridad = merged.prioridad;
      const newOrden = merged.orden;

      if (newPrioridad !== oldPrioridad) {
        unshiftOrden(db, presupuestoId, oldPrioridad, current.orden);
        shiftOrden(db, presupuestoId, newPrioridad, newOrden);
      } else if (newOrden !== current.orden) {
        if (newOrden < current.orden) {
          shiftOrden(db, presupuestoId, newPrioridad, newOrden);
        }
      }

      const now = new Date().toISOString();
      db.run(
        `UPDATE subpresupuesto
         SET nombre = ?, color = ?, limite = ?, limite_moneda = ?, prioridad = ?, recurrente = ?, orden = ?, activo = ?, updated_at = ?
         WHERE id = ?`,
        [
          merged.nombre,
          merged.color,
          Number(merged.limite),
          merged.limiteMoneda,
          merged.prioridad,
          merged.recurrente ? 1 : 0,
          merged.orden,
          merged.activo ? 1 : 0,
          now,
          id,
        ],
      );
    });
    persist();
    notifyChange();
  },

  softDelete(id: SubpresupuestoId): void {
    const db = getDB();
    const now = new Date().toISOString();
    db.run("UPDATE subpresupuesto SET activo = 0, updated_at = ? WHERE id = ?", [now, id]);
    persist();
    notifyChange();
  },
};

export const snapshotsRepo = {
  list(): PresupuestoSnapshot[] {
    const db = getDB();
    const stmt = db.prepare("SELECT * FROM snapshot_presupuesto ORDER BY created_at DESC");
    const out: PresupuestoSnapshot[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      out.push(JSON.parse(row.data as string) as PresupuestoSnapshot);
    }
    stmt.free();
    return out;
  },

  add(s: PresupuestoSnapshot): void {
    const db = getDB();
    const now = new Date().toISOString();
    db.run(
      `INSERT INTO snapshot_presupuesto (id, presupuesto_id, periodo_inicio, periodo_fin, data, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [s.id, s.presupuestoIdOrigen, s.fechaInicio, s.fechaFin, JSON.stringify(s), s.createdAt, now],
    );
    persist();
    notifyChange();
  },
};

// Re-exporta el helper de Money para los consumers.
export type { Money };

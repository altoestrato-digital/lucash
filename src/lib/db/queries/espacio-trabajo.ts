"use client";

import { getDB, persist, notifyChange, queryAll, queryOne } from "../client";
import type { EspacioTrabajo, EspacioTrabajoInput, EspacioTrabajoId } from "@/types/espacio-trabajo";
import type { Moneda } from "@/types/cartera";

type Row = Record<string, unknown>;

function rowToEspacioTrabajo(row: Row): EspacioTrabajo {
  return {
    id: row.id as EspacioTrabajoId,
    nombre: row.nombre as string,
    esDefault: Boolean(row.es_default),
    monedaDefault: (row.moneda_default as Moneda) ?? "Bs",
    createdAt: row.created_at as string,
  };
}

let idCounter = 1;
const genId = (prefix: string) => `${prefix}-${Date.now()}-${idCounter++}`;

export const espacioTrabajoRepo = {
  list(): EspacioTrabajo[] {
    return queryAll(
      "SELECT * FROM espacio_trabajo ORDER BY es_default DESC, created_at ASC",
      [],
      rowToEspacioTrabajo,
    );
  },

  getActual(): EspacioTrabajo | null {
    return queryOne(
      "SELECT * FROM espacio_trabajo WHERE es_default = 1 LIMIT 1",
      [],
      rowToEspacioTrabajo,
    );
  },

  getById(id: string): EspacioTrabajo | null {
    return queryOne(
      "SELECT * FROM espacio_trabajo WHERE id = ?",
      [id],
      rowToEspacioTrabajo,
    );
  },

  create(data: EspacioTrabajoInput): EspacioTrabajo {
    const db = getDB();
    const id = genId("et") as EspacioTrabajoId;
    const now = new Date().toISOString();
    const created: EspacioTrabajo = {
      ...data,
      id,
      createdAt: now,
    };
    db.run(
      `INSERT INTO espacio_trabajo (id, nombre, es_default, moneda_default, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [created.id, created.nombre, created.esDefault ? 1 : 0, created.monedaDefault, created.createdAt],
    );
    persist();
    notifyChange();
    return created;
  },

  update(id: EspacioTrabajoId, data: Partial<EspacioTrabajoInput>): void {
    const db = getDB();
    const current = queryOne("SELECT * FROM espacio_trabajo WHERE id = ?", [id], rowToEspacioTrabajo);
    if (!current) return;
    const merged = { ...current, ...data };
    db.run(
      `UPDATE espacio_trabajo SET nombre = ?, es_default = ?, moneda_default = ? WHERE id = ?`,
      [merged.nombre, merged.esDefault ? 1 : 0, merged.monedaDefault, id],
    );
    persist();
    notifyChange();
  },

  delete(id: EspacioTrabajoId): void {
    const db = getDB();
    db.run("DELETE FROM espacio_trabajo WHERE id = ?", [id]);
    persist();
    notifyChange();
  },
};

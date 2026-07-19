"use client";

import { getDB, persist, notifyChange, withTransaction, queryAll } from "../client";
import type { SqlValue } from "sql.js";
import type { CategoriaDetalle } from "@/types/presupuesto";
import type { CategoriaId, CategoriaDetalleId } from "@/types/transaccion";
import { bs } from "@/lib/money";
import { hexColor } from "@/types/hex-color";

type Row = Record<string, unknown>;

function rowToCategoriaDetalle(row: Row): CategoriaDetalle {
  return {
    id: row.id as CategoriaDetalleId,
    categoriaId: row.categoria_id as CategoriaId,
    nombre: row.nombre as string,
    montoEstimado: bs(row.monto_estimado as number),
    orden: row.orden as number,
    color: hexColor(row.color as string),
    activo: Boolean(row.activo),
  };
}

let idCounter = 1;
const genId = (prefix: string) => `${prefix}-${Date.now()}-${idCounter++}`;

export const categoriaDetallesRepo = {
  listByCategoria(categoriaId: string): CategoriaDetalle[] {
    return queryAll(
      "SELECT * FROM categoria_detalle WHERE categoria_id = ? AND activo = 1 ORDER BY orden",
      [categoriaId],
      rowToCategoriaDetalle,
    );
  },

  add(d: Omit<CategoriaDetalle, "id" | "activo"> & { categoriaId: string }): CategoriaDetalle {
    const created = withTransaction(() => {
      const id = genId("catdet") as CategoriaDetalleId;
      const now = new Date().toISOString();
      const db = getDB();
      db.run(
        `INSERT INTO categoria_detalle (id, categoria_id, nombre, monto_estimado, orden, color, activo, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        [id, d.categoriaId, d.nombre, Number(d.montoEstimado), d.orden, d.color, now, now],
      );
      return {
        ...d,
        id,
        activo: true,
      } as CategoriaDetalle;
    });
    persist();
    notifyChange();
    return created;
  },

  update(id: CategoriaDetalleId, data: Partial<CategoriaDetalle>): void {
    const db = getDB();
    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: SqlValue[] = [];

    if (data.nombre !== undefined) { fields.push("nombre = ?"); values.push(data.nombre); }
    if (data.montoEstimado !== undefined) { fields.push("monto_estimado = ?"); values.push(Number(data.montoEstimado)); }
    if (data.orden !== undefined) { fields.push("orden = ?"); values.push(data.orden); }
    if (data.color !== undefined) { fields.push("color = ?"); values.push(data.color); }
    if (data.activo !== undefined) { fields.push("activo = ?"); values.push(data.activo ? 1 : 0); }

    if (fields.length === 0) return;
    fields.push("updated_at = ?");
    values.push(now);
    values.push(id);

    db.run(`UPDATE categoria_detalle SET ${fields.join(", ")} WHERE id = ?`, values);
    persist();
    notifyChange();
  },

  softDelete(id: CategoriaDetalleId): void {
    const db = getDB();
    const now = new Date().toISOString();
    db.run("UPDATE categoria_detalle SET activo = 0, updated_at = ? WHERE id = ?", [now, id]);
    persist();
    notifyChange();
  },
};

"use client";

import { getDB, persist, notifyChange } from "../client";
import type { ISODateTime } from "@/lib/dates";
import type { CarteraId, Moneda } from "@/types/cartera";
import type {
  Adjunto,
  CategoriaId,
  CategoriaDetalleId,
  TipoTransaccion,
  Transaccion,
} from "@/types/transaccion";

type Row = Record<string, unknown>;

function rowToTransaccion(row: Row): Transaccion {
  return {
    id: row.id as string,
    tipo: row.tipo as TipoTransaccion,
    fecha: row.fecha as ISODateTime,
    emisorReceptor: row.emisor_receptor as string,
    concepto: (row.concepto as string) ?? "",
    montoOriginal: row.monto_original as number,
    monedaOriginal: (row.moneda_original as Moneda) ?? "Bs",
    montoBs: row.monto_bs as Transaccion["montoBs"],
    montoUsd: row.monto_usd as Transaccion["montoUsd"],
    tasaOficial: (row.tasa_oficial as number) ?? 0,
    tasaParalelo: (row.tasa_paralelo as number) ?? 0,
    tasaTipo: (row.tasa_tipo as "oficial" | "paralelo") ?? "oficial",
    carteraId: (row.cartera_id as CarteraId) ?? ("" as CarteraId),
    saldoPrevio: (row.saldo_previo as number) ?? 0,
    saldoPosterior: (row.saldo_posterior as number) ?? 0,
    categoriaId:
      row.categoria_id === null ? null : (row.categoria_id as CategoriaId),
    categoriaDetalleId:
      row.categoria_detalle_id === null ? null : (row.categoria_detalle_id as CategoriaDetalleId),
    descripcion: (row.descripcion as string | null) ?? undefined,
    adjunto: row.adjunto ? (JSON.parse(row.adjunto as string) as Adjunto) : undefined,
    fuenteOcr: Boolean(row.fuente_ocr),
    usoAhorroConfirmado:
      row.uso_ahorro_confirmado === null ? undefined : Boolean(row.uso_ahorro_confirmado),
    esRedireccionExcedente: row.es_redireccion_excedente
      ? Boolean(row.es_redireccion_excedente)
      : undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

let idCounter = 1;
const genId = () => `tx-${Date.now()}-${idCounter++}`;

export interface AddTransaccionInput {
  tipo: TipoTransaccion;
  fecha: ISODateTime;
  emisorReceptor: string;
  concepto: string;
  montoOriginal: number;
  monedaOriginal: Moneda;
  montoBs: Transaccion["montoBs"];
  montoUsd: Transaccion["montoUsd"];
  tasaOficial: number;
  tasaParalelo: number;
  tasaTipo: "oficial" | "paralelo";
  carteraId: CarteraId;
  saldoPrevio: number;
  saldoPosterior: number;
  descripcion?: string;
  categoriaId?: CategoriaId | null;
  categoriaDetalleId?: CategoriaDetalleId | null;
  adjunto?: Adjunto;
  fuenteOcr?: boolean;
  usoAhorroConfirmado?: boolean;
  esRedireccionExcedente?: boolean;
}

export const transaccionesRepo = {
  list(): Transaccion[] {
    const db = getDB();
    const stmt = db.prepare(
      "SELECT * FROM transaccion WHERE activa = 1 ORDER BY fecha DESC, created_at DESC",
    );
    const out: Transaccion[] = [];
    while (stmt.step()) out.push(rowToTransaccion(stmt.getAsObject()));
    stmt.free();
    return out;
  },

  add(input: AddTransaccionInput): Transaccion {
    const id = genId();
    const now = new Date().toISOString();
    const created: Transaccion = {
      ...input,
      id,
      createdAt: now,
      updatedAt: now,
      categoriaId: input.categoriaId ?? null,
      categoriaDetalleId: input.categoriaDetalleId ?? null,
      fuenteOcr: input.fuenteOcr ?? false,
      usoAhorroConfirmado: input.usoAhorroConfirmado ?? false,
      esRedireccionExcedente: input.esRedireccionExcedente ?? false,
    };
    const db = getDB();
    db.run(
      `INSERT INTO transaccion
       (id, tipo, fecha, emisor_receptor, concepto,
        monto_original, moneda_original, monto_bs, monto_usd,
        tasa_oficial, tasa_paralelo, tasa_tipo,
        cartera_id, saldo_previo, saldo_posterior,
        descripcion, categoria_id, categoria_detalle_id, adjunto,
        fuente_ocr, uso_ahorro_confirmado, es_redireccion_excedente, activa, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [
        created.id,
        created.tipo,
        created.fecha,
        created.emisorReceptor,
        created.concepto,
        created.montoOriginal,
        created.monedaOriginal,
        Number(created.montoBs),
        Number(created.montoUsd),
        created.tasaOficial,
        created.tasaParalelo,
        created.tasaTipo,
        created.carteraId,
        created.saldoPrevio,
        created.saldoPosterior,
        created.descripcion ?? null,
        created.categoriaId ?? null,
        created.categoriaDetalleId ?? null,
        created.adjunto ? JSON.stringify(created.adjunto) : null,
        created.fuenteOcr ? 1 : 0,
        created.usoAhorroConfirmado === undefined ? null : created.usoAhorroConfirmado ? 1 : 0,
        created.esRedireccionExcedente ? 1 : 0,
        created.createdAt,
        created.updatedAt,
      ],
    );
    persist();
    notifyChange();
    return created;
  },

  softDelete(id: string): void {
    const db = getDB();
    db.run("UPDATE transaccion SET activa = 0 WHERE id = ?", [id]);
    persist();
    notifyChange();
  },

  clearAll(): void {
    const db = getDB();
    db.run("DELETE FROM movimiento_cartera WHERE transaccion_origen_id IS NOT NULL");
    db.run("DELETE FROM transaccion");
    persist();
    notifyChange();
  },
};

export type { Transaccion, TipoTransaccion, Adjunto, CategoriaId, CategoriaDetalleId, CarteraId, Moneda };

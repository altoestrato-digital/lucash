"use client";

import initSqlJs, { type Database, type SqlJsStatic, type BindParams } from "sql.js";
import { SCHEMA_SQL } from "./schema";

const WASM_URL = "/sql-wasm.wasm";

const IDB_NAME = "lucash-sqlite";
const IDB_STORE = "files";
const IDB_KEY = "db";

let SQL: SqlJsStatic | null = null;
let dbInstance: Database | null = null;
const listeners = new Set<() => void>();

let persistTimer: ReturnType<typeof setTimeout> | null = null;

export type Row = Record<string, unknown>;

export function withTransaction<T>(fn: () => T): T {
  const db = getDB();
  db.run("BEGIN TRANSACTION");
  try {
    const result = fn();
    db.run("COMMIT");
    return result;
  } catch (e) {
    try {
      db.run("ROLLBACK");
    } catch (rollbackErr) {
      console.error("[lucash-db] Rollback failed:", rollbackErr);
    }
    throw e;
  }
}

export function queryAll<T>(sql: string, params: BindParams, mapper: (row: Row) => T): T[] {
  const db = getDB();
  const stmt = db.prepare(sql);
  const out: T[] = [];
  stmt.bind(params);
  while (stmt.step()) out.push(mapper(stmt.getAsObject()));
  stmt.free();
  return out;
}

export function queryOne<T>(sql: string, params: BindParams, mapper: (row: Row) => T): T | null {
  const db = getDB();
  const stmt = db.prepare(sql);
  stmt.bind(params);
  if (!stmt.step()) {
    stmt.free();
    return null;
  }
  const row = mapper(stmt.getAsObject());
  stmt.free();
  return row;
}

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function loadFromIDB(): Promise<Uint8Array | null> {
  if (typeof indexedDB === "undefined") return null;
  try {
    const db = await openIDB();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, "readonly");
      const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
      req.onsuccess = () => resolve((req.result as Uint8Array | undefined) ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function saveToIDB(data: Uint8Array): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).put(data, IDB_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function loadSqlJs(): Promise<SqlJsStatic> {
  if (SQL) return SQL;
  SQL = await initSqlJs({ locateFile: () => WASM_URL });
  return SQL;
}

export async function initDB(): Promise<Database> {
  if (dbInstance) return dbInstance;
  const Sql = await loadSqlJs();
  const saved = await loadFromIDB();
  if (saved && saved.byteLength > 0) {
    dbInstance = new Sql.Database(saved);
  } else {
    dbInstance = new Sql.Database();
  }
  dbInstance.exec(SCHEMA_SQL);
  migrateV5(dbInstance);
  migrateV6(dbInstance);
  migrateV7(dbInstance);
  await persistNow();
  return dbInstance;
}

/**
 * Estrategia de migraciones (frontend-only SQLite):
 *
 * - SCHEMA_VERSION refleja la versión lógica del esquema actual.
 * - Las tablas se crean con `CREATE TABLE IF NOT EXISTS` incluyendo ya las
 *   columnas de la versión actual. Nuevas DBs no necesitan migraciones.
 * - Para DBs existentes se ejecutan migraciones idempotentes basadas en
 *   `PRAGMA table_info(...)`. Cada migración chequea si la columna ya existe
 *   antes de aplicar `ALTER TABLE`.
 * - Las migraciones deben ser forward-only y atómicas: si una falla, la app
 *   continúa con el esquema anterior (no se ejecutan DDL parciales).
 * - TODO: cuando el proyecto crezca, considerar una tabla `schema_migrations`
 *   con versiones aplicadas para reemplazar el chequeo por `PRAGMA`.
 */

function migrateV5(db: Database) {
  try {
    const cols = db.exec("PRAGMA table_info(presupuesto)");
    const colNames = cols[0]?.values.map((r) => r[1] as string) ?? [];

    if (colNames.includes("ingreso_esperado_bs")) {
      if (!colNames.includes("ingreso_esperado")) {
        db.run("ALTER TABLE presupuesto ADD COLUMN ingreso_esperado REAL NOT NULL DEFAULT 0");
      }
      if (!colNames.includes("ingreso_esperado_moneda")) {
        db.run("ALTER TABLE presupuesto ADD COLUMN ingreso_esperado_moneda TEXT NOT NULL DEFAULT 'Bs'");
      }
      if (!colNames.includes("gasto_maximo_esperado")) {
        db.run("ALTER TABLE presupuesto ADD COLUMN gasto_maximo_esperado REAL NOT NULL DEFAULT 0");
      }
      if (!colNames.includes("gasto_maximo_esperado_moneda")) {
        db.run("ALTER TABLE presupuesto ADD COLUMN gasto_maximo_esperado_moneda TEXT NOT NULL DEFAULT 'Bs'");
      }
      db.run("UPDATE presupuesto SET ingreso_esperado = ingreso_esperado_bs, gasto_maximo_esperado = otros_gastos_bs");
      db.run("ALTER TABLE presupuesto DROP COLUMN ingreso_esperado_bs");
      db.run("ALTER TABLE presupuesto DROP COLUMN otros_gastos_bs");
    }

    const subCols = db.exec("PRAGMA table_info(subpresupuesto)");
    const subColNames = subCols[0]?.values.map((r) => r[1] as string) ?? [];

    if (subColNames.includes("limite_bs")) {
      if (!subColNames.includes("limite")) {
        db.run("ALTER TABLE subpresupuesto ADD COLUMN limite REAL NOT NULL DEFAULT 0");
      }
      if (!subColNames.includes("limite_moneda")) {
        db.run("ALTER TABLE subpresupuesto ADD COLUMN limite_moneda TEXT NOT NULL DEFAULT 'Bs'");
      }
      db.run("UPDATE subpresupuesto SET limite = limite_bs");
      db.run("ALTER TABLE subpresupuesto DROP COLUMN limite_bs");
    }
  } catch (e) {
    console.warn("[lucash-db] Migration v5 skipped:", e);
  }
}

function migrateV6(db: Database) {
  try {
    const now = new Date().toISOString();
    db.run("BEGIN TRANSACTION");

    const tables = ["cuenta", "movimiento_cuenta", "presupuesto", "subpresupuesto", "snapshot_presupuesto", "transaccion"];
    for (const table of tables) {
      const cols = db.exec(`PRAGMA table_info(${table})`);
      const colNames = cols[0]?.values.map((r) => r[1] as string) ?? [];
      if (!colNames.includes("updated_at")) {
        db.run(`ALTER TABLE ${table} ADD COLUMN updated_at TEXT NOT NULL DEFAULT ''`);
        db.run(`UPDATE ${table} SET updated_at = ? WHERE updated_at = ''`, [now]);
      }
    }

    const metaCols = db.exec("PRAGMA table_info(meta_cuenta)");
    const metaColNames = metaCols[0]?.values.map((r) => r[1] as string) ?? [];
    if (!metaColNames.includes("created_at")) {
      db.run(`ALTER TABLE meta_cuenta ADD COLUMN created_at TEXT NOT NULL DEFAULT ''`);
      db.run(`UPDATE meta_cuenta SET created_at = ? WHERE created_at = ''`, [now]);
    }
    if (!metaColNames.includes("updated_at")) {
      db.run(`ALTER TABLE meta_cuenta ADD COLUMN updated_at TEXT NOT NULL DEFAULT ''`);
      db.run(`UPDATE meta_cuenta SET updated_at = ? WHERE updated_at = ''`, [now]);
    }

    db.run("COMMIT");
  } catch (e) {
    try {
      db.run("ROLLBACK");
    } catch (rollbackErr) {
      console.error("[lucash-db] Migration v6 rollback failed:", rollbackErr);
    }
    console.warn("[lucash-db] Migration v6 skipped:", e);
  }
}

function migrateV7(db: Database) {
  try {
    const now = new Date().toISOString();

    // Crear tabla usuario si no existe (defensivo: SCHEMA_SQL ya la crea, pero si vienes de V6 la base persiste).
    const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='usuario'");
    const hasUsuario = tables[0]?.values.length > 0;
    if (!hasUsuario) {
      db.run(`
        CREATE TABLE usuario (
          id TEXT PRIMARY KEY,
          nombre TEXT NOT NULL,
          email TEXT,
          contrasena_hash TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `);
    }

    // Seedear usuario por defecto si la tabla está vacía.
    const count = queryOne<number>(
      "SELECT COUNT(*) AS n FROM usuario",
      [],
      (row) => Number(row.n),
    ) ?? 0;
    if (count === 0) {
      db.run(
        `INSERT INTO usuario (id, nombre, email, contrasena_hash, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        ["default", "Usuario", null, "", now, now],
      );
    }

    // Asegurar columna usuario_id en perfil.
    const perfilCols = db.exec("PRAGMA table_info(perfil)");
    const perfilColNames = perfilCols[0]?.values.map((r) => r[1] as string) ?? [];
    if (!perfilColNames.includes("usuario_id")) {
      db.run("ALTER TABLE perfil ADD COLUMN usuario_id TEXT NOT NULL DEFAULT 'default'");
    }

    // Vincular perfil existente al usuario por defecto.
    db.run("UPDATE perfil SET usuario_id = 'default' WHERE usuario_id IS NULL OR usuario_id = ''");
  } catch (e) {
    console.warn("[lucash-db] Migration v7 skipped:", e);
  }
}

export function getDB(): Database {
  if (!dbInstance) {
    console.warn("[lucash-db] DB no inicializada aún.");
    throw new Error("DB no inicializada.");
  }
  return dbInstance;
}

export function isDBReady(): boolean {
  return dbInstance !== null;
}

export async function persistNow(): Promise<void> {
  if (!dbInstance) return;
  const data = dbInstance.export();
  try {
    await saveToIDB(data);
  } catch (e) {
    console.error("[lucash-db] Error al persistir:", e);
  }
}

export function persist(): void {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    void persistNow();
  }, 50);
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyChange(): void {
  for (const l of listeners) l();
}

export function resetAccountData(): void {
  const db = getDB();
  db.run("DELETE FROM movimiento_cuenta");
  db.run("DELETE FROM transaccion");
  db.run("UPDATE cuenta SET saldo = 0");
  persist();
  notifyChange();
}

export function wipeDB(): void {
  const db = getDB();
  db.run("DELETE FROM movimiento_cuenta");
  db.run("DELETE FROM meta_cuenta");
  db.run("DELETE FROM cuenta");
  db.run("DELETE FROM transaccion");
  db.run("DELETE FROM snapshot_presupuesto");
  db.run("DELETE FROM subpresupuesto");
  db.run("DELETE FROM presupuesto");
  db.run("DELETE FROM tasa_bcv");
  db.run("DELETE FROM tasa_cripto");
  db.run("DELETE FROM tasa_dolarapi");
  persist();
  notifyChange();
}

export async function nukeIDB(): Promise<void> {
  dbInstance = null;
  SQL = null;
  indexedDB.deleteDatabase(IDB_NAME);
  await new Promise((r) => setTimeout(r, 200));
  window.location.reload();
}

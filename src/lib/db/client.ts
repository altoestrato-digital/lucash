"use client";

import initSqlJs, { type Database, type SqlJsStatic, type BindParams } from "sql.js";
import { SCHEMA_SQL } from "./schema";

const WASM_URL = (process.env.NEXT_PUBLIC_BASE_PATH ?? "") + "/sql-wasm.wasm";

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

function validateSchema(db: Database): boolean {
  try {
    const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
    const tableNames = tables[0]?.values.map((r) => r[0] as string) ?? [];
    if (tableNames.length === 0) return true;

    if (tableNames.includes("cuenta") || tableNames.includes("movimiento_cuenta") || tableNames.includes("meta_cuenta")) {
      return false;
    }

    if (tableNames.includes("transaccion")) {
      const cols = db.exec("PRAGMA table_info(transaccion)");
      const colNames = cols[0]?.values.map((r) => r[1] as string) ?? [];
      if (colNames.includes("cuenta_id")) return false;
    }

    return true;
  } catch {
    return false;
  }
}

function dropAllTables(db: Database): void {
  const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
  const names = tables[0]?.values.map((r) => r[0] as string) ?? [];
  for (const name of names) {
    db.run(`DROP TABLE IF EXISTS "${name}"`);
  }
  const idxs = db.exec("SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'");
  const idxNames = idxs[0]?.values.map((r) => r[0] as string) ?? [];
  for (const name of idxNames) {
    db.run(`DROP INDEX IF EXISTS "${name}"`);
  }
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

  if (!validateSchema(dbInstance)) {
    console.warn("[lucash-db] Schema corrupt detected, rebuilding from scratch...");
    dropAllTables(dbInstance);
  }

  dbInstance.exec(SCHEMA_SQL);

  try {
    dbInstance.run("ALTER TABLE categoria_detalle ADD COLUMN moneda TEXT NOT NULL DEFAULT 'Bs'");
  } catch {
    // Column already exists — safe to ignore
  }

  try {
    dbInstance.run("ALTER TABLE presupuesto ADD COLUMN persistente INTEGER NOT NULL DEFAULT 0");
  } catch {
    // Column already exists — safe to ignore
  }

  try {
    dbInstance.run("ALTER TABLE transaccion ADD COLUMN tasa_tipo TEXT NOT NULL DEFAULT 'oficial'");
  } catch {
    // Column already exists — safe to ignore
  }

  await persistNow();
  return dbInstance;
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
  db.run("DELETE FROM movimiento_cartera");
  db.run("DELETE FROM transaccion");
  db.run("UPDATE cartera SET saldo = 0");
  persist();
  notifyChange();
}

export function wipeDB(): void {
  const db = getDB();
  db.run("DELETE FROM movimiento_cartera");
  db.run("DELETE FROM meta_cartera");
  db.run("DELETE FROM cartera");
  db.run("DELETE FROM transaccion");
  db.run("DELETE FROM snapshot_presupuesto");
  db.run("DELETE FROM categoria_detalle");
  db.run("DELETE FROM categoria");
  db.run("DELETE FROM presupuesto");
  db.run("DELETE FROM espacio_trabajo");
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

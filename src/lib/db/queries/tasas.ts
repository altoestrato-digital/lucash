"use client";

import { getDB, persist, notifyChange } from "../client";
import type { ISODate } from "@/lib/dates";
import type { Money } from "@/lib/money";
import { bs } from "@/lib/money";

export type FuenteTasa = "manual" | "oficial" | "paralelo";

export interface TasaBcvEntry {
  fecha: ISODate;
  tasa: Money;
  fuente: FuenteTasa;
  fetchedAt: string;
}

export interface TasaCriptoEntry {
  moneda: "USDT" | "BTC" | "ETH";
  fecha: ISODate;
  precioUsd: number;
  fuente: "auto" | "manual";
  fetchedAt: string;
}

export interface TasaDolarapiEntry {
  fecha: ISODate;
  fuente: "oficial" | "paralelo";
  valor: number;
  fetchedAt: string;
}

type Row = Record<string, unknown>;

function parseFuenteBcv(raw: string | null | undefined): FuenteTasa {
  if (raw === "oficial" || raw === "paralelo") return raw;
  if (raw === "auto") return "oficial";
  return "manual";
}

function rowToBcv(row: Row): TasaBcvEntry {
  return {
    fecha: row.fecha as ISODate,
    tasa: bs(row.tasa as number),
    fuente: parseFuenteBcv(row.fuente as string | null),
    fetchedAt: row.fetched_at as string,
  };
}

function rowToCripto(row: Row): TasaCriptoEntry {
  return {
    moneda: row.moneda as "USDT" | "BTC" | "ETH",
    fecha: row.fecha as ISODate,
    precioUsd: row.precio_usd as number,
    fuente: (row.fuente as string) === "auto" ? "auto" : "manual",
    fetchedAt: row.fetched_at as string,
  };
}

function rowToDolarapi(row: Row): TasaDolarapiEntry {
  return {
    fecha: row.fecha as ISODate,
    fuente: (row.fuente as string) === "paralelo" ? "paralelo" : "oficial",
    valor: row.valor as number,
    fetchedAt: row.fetched_at as string,
  };
}

export const tasasBcvRepo = {
  get(fecha: ISODate): TasaBcvEntry | null {
    const db = getDB();
    const stmt = db.prepare("SELECT * FROM tasa_bcv WHERE fecha = ?");
    stmt.bind([fecha]);
    if (stmt.step()) {
      const entry = rowToBcv(stmt.getAsObject());
      stmt.free();
      return entry;
    }
    stmt.free();
    return null;
  },

  getVigente(fecha: ISODate): TasaBcvEntry | null {
    const exact = tasasBcvRepo.get(fecha);
    if (exact) return exact;
    const db = getDB();
    const stmt = db.prepare("SELECT * FROM tasa_bcv ORDER BY fecha DESC LIMIT 1");
    if (!stmt.step()) {
      stmt.free();
      return null;
    }
    const entry = rowToBcv(stmt.getAsObject());
    stmt.free();
    return entry;
  },

  set(fecha: ISODate, tasa: number, fuente: FuenteTasa = "manual"): void {
    const db = getDB();
    db.run(
      `INSERT OR REPLACE INTO tasa_bcv (fecha, tasa, fuente, fetched_at)
       VALUES (?, ?, ?, ?)`,
      [fecha, tasa, fuente, new Date().toISOString()],
    );
    persist();
    notifyChange();
  },
};

export const tasasCriptoRepo = {
  get(moneda: "USDT" | "BTC" | "ETH", fecha: ISODate): TasaCriptoEntry | null {
    const db = getDB();
    const stmt = db.prepare("SELECT * FROM tasa_cripto WHERE moneda = ? AND fecha = ?");
    stmt.bind([moneda, fecha]);
    if (stmt.step()) {
      const entry = rowToCripto(stmt.getAsObject());
      stmt.free();
      return entry;
    }
    stmt.free();
    return null;
  },

  getHoy(moneda: "USDT" | "BTC" | "ETH"): TasaCriptoEntry | null {
    const db = getDB();
    const stmt = db.prepare(
      "SELECT * FROM tasa_cripto WHERE moneda = ? ORDER BY fecha DESC LIMIT 1",
    );
    stmt.bind([moneda]);
    if (stmt.step()) {
      const entry = rowToCripto(stmt.getAsObject());
      stmt.free();
      return entry;
    }
    stmt.free();
    return null;
  },

  set(
    moneda: "USDT" | "BTC" | "ETH",
    fecha: ISODate,
    precioUsd: number,
    fuente: "auto" | "manual" = "manual",
  ): void {
    const db = getDB();
    db.run(
      `INSERT OR REPLACE INTO tasa_cripto (moneda, fecha, precio_usd, fuente, fetched_at)
       VALUES (?, ?, ?, ?, ?)`,
      [moneda, fecha, precioUsd, fuente, new Date().toISOString()],
    );
    persist();
    notifyChange();
  },
};

export const tasasDolarApiRepo = {
  get(fecha: ISODate, fuente: "oficial" | "paralelo"): TasaDolarapiEntry | null {
    const db = getDB();
    const stmt = db.prepare("SELECT * FROM tasa_dolarapi WHERE fecha = ? AND fuente = ?");
    stmt.bind([fecha, fuente]);
    if (stmt.step()) {
      const entry = rowToDolarapi(stmt.getAsObject());
      stmt.free();
      return entry;
    }
    stmt.free();
    return null;
  },

  getMostRecent(fuente: "oficial" | "paralelo"): TasaDolarapiEntry | null {
    const db = getDB();
    const stmt = db.prepare(
      "SELECT * FROM tasa_dolarapi WHERE fuente = ? ORDER BY fecha DESC LIMIT 1",
    );
    stmt.bind([fuente]);
    if (stmt.step()) {
      const entry = rowToDolarapi(stmt.getAsObject());
      stmt.free();
      return entry;
    }
    stmt.free();
    return null;
  },

  listByFecha(fecha: ISODate): TasaDolarapiEntry[] {
    const db = getDB();
    const stmt = db.prepare("SELECT * FROM tasa_dolarapi WHERE fecha = ? ORDER BY fuente");
    stmt.bind([fecha]);
    const out: TasaDolarapiEntry[] = [];
    while (stmt.step()) out.push(rowToDolarapi(stmt.getAsObject()));
    stmt.free();
    return out;
  },

  set(fecha: ISODate, fuente: "oficial" | "paralelo", valor: number): void {
    const db = getDB();
    db.run(
      `INSERT OR REPLACE INTO tasa_dolarapi (fecha, fuente, valor, fetched_at)
       VALUES (?, ?, ?, ?)`,
      [fecha, fuente, valor, new Date().toISOString()],
    );
    persist();
    notifyChange();
  },
};

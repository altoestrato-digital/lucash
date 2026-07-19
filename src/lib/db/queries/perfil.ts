"use client";

import { getDB, persist, notifyChange } from "../client";
import type { ISODate } from "@/lib/dates";
import type {
  AvatarDataUrl,
  Perfil,
  PerfilId,
  Preferencias,
} from "@/types/perfil";
import { PREFERENCIAS_DEFAULT } from "@/types/perfil";
import { usuariosRepo } from "./usuario";

type Row = Record<string, unknown>;

const PERFIL_ID = "perfil-local" as PerfilId;

function parsePreferencias(raw: string | null | undefined): Preferencias {
  if (!raw) return PREFERENCIAS_DEFAULT;
  try {
    return { ...PREFERENCIAS_DEFAULT, ...(JSON.parse(raw) as Partial<Preferencias>) };
  } catch {
    return PREFERENCIAS_DEFAULT;
  }
}

function rowToPerfil(row: Row): Perfil {
  return {
    id: row.id as PerfilId,
    usuarioId: (row.usuario_id as string) ?? usuariosRepo.getActivo().id,
    nombre: (row.nombre as string) ?? "",
    email: (row.email as string | null) ?? undefined,
    avatar: (row.avatar as AvatarDataUrl | null) ?? undefined,
    preferencias: parsePreferencias(row.preferencias as string | null),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export const perfilRepo = {
  get(): Perfil | null {
    const db = getDB();
    const stmt = db.prepare("SELECT * FROM perfil WHERE id = ?");
    stmt.bind([PERFIL_ID]);
    if (stmt.step()) {
      const perfil = rowToPerfil(stmt.getAsObject());
      stmt.free();
      return perfil;
    }
    stmt.free();
    return null;
  },

  upsert(data: Partial<Omit<Perfil, "id" | "createdAt" | "updatedAt" | "usuarioId">>): Perfil {
    const existing = perfilRepo.get();
    const now = new Date().toISOString();
    const usuarioId = usuariosRepo.getActivo().id;
    const db = getDB();

    if (!existing) {
      const next: Perfil = {
        id: PERFIL_ID,
        usuarioId,
        nombre: data.nombre ?? "",
        email: data.email,
        avatar: data.avatar,
        preferencias: { ...PREFERENCIAS_DEFAULT, ...(data.preferencias ?? {}) },
        createdAt: now,
        updatedAt: now,
      };
      db.run(
        `INSERT INTO perfil (id, usuario_id, nombre, email, avatar, preferencias, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          next.id,
          next.usuarioId,
          next.nombre,
          next.email ?? null,
          next.avatar ?? null,
          JSON.stringify(next.preferencias),
          next.createdAt,
          next.updatedAt,
        ],
      );
      persist();
      notifyChange();
      return next;
    }

    const merged: Perfil = {
      ...existing,
      ...data,
      preferencias: { ...existing.preferencias, ...(data.preferencias ?? {}) },
      id: PERFIL_ID,
      usuarioId: existing.usuarioId,
      updatedAt: now,
    };
    db.run(
      `UPDATE perfil SET usuario_id = ?, nombre = ?, email = ?, avatar = ?, preferencias = ?, updated_at = ? WHERE id = ?`,
      [
        merged.usuarioId,
        merged.nombre,
        merged.email ?? null,
        merged.avatar ?? null,
        JSON.stringify(merged.preferencias),
        merged.updatedAt,
        PERFIL_ID,
      ],
    );
    persist();
    notifyChange();
    return merged;
  },

  setAvatar(avatar: AvatarDataUrl | undefined): Perfil {
    return perfilRepo.upsert({ avatar });
  },
};

// Utilidad de tipos.
export type { Perfil, PerfilId, Preferencias };

// Re-exporta la fecha actual (usada por el hook al crear el row inicial).
export type { ISODate };

"use client";

import { getDB, persist, notifyChange, queryAll, queryOne } from "../client";
import type { Usuario, UsuarioId, UsuarioInput } from "@/types/usuario";
import { USUARIO_DEFAULT_ID } from "@/types/usuario";

type Row = Record<string, unknown>;

function rowToUsuario(row: Row): Usuario {
  return {
    id: row.id as UsuarioId,
    nombre: (row.nombre as string) ?? "",
    email: (row.email as string | null) ?? undefined,
    contrasenaHash: (row.contrasena_hash as string) ?? "",
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export const usuariosRepo = {
  list(): Usuario[] {
    return queryAll("SELECT * FROM usuario ORDER BY created_at", [], rowToUsuario);
  },

  getById(id: UsuarioId): Usuario | null {
    return queryOne(
      "SELECT * FROM usuario WHERE id = ?",
      [id],
      rowToUsuario,
    );
  },

  getActivo(): Usuario {
    return usuariosRepo.getById(USUARIO_DEFAULT_ID) ?? usuariosRepo.list()[0] ?? {
      id: USUARIO_DEFAULT_ID,
      nombre: "Usuario",
      email: undefined,
      contrasenaHash: "",
      createdAt: new Date(0).toISOString(),
      updatedAt: new Date(0).toISOString(),
    };
  },

  update(id: UsuarioId, data: Partial<UsuarioInput>): Usuario {
    const current = usuariosRepo.getById(id);
    if (!current) {
      throw new Error(`Usuario ${id} no existe.`);
    }
    const now = new Date().toISOString();
    const merged: Usuario = {
      ...current,
      nombre: data.nombre ?? current.nombre,
      email: data.email ?? current.email,
      contrasenaHash: data.contrasenaHash ?? (data.contrasena ? data.contrasena : current.contrasenaHash),
      updatedAt: now,
    };
    const db = getDB();
    db.run(
      `UPDATE usuario
       SET nombre = ?, email = ?, contrasena_hash = ?, updated_at = ?
       WHERE id = ?`,
      [
        merged.nombre,
        merged.email ?? null,
        merged.contrasenaHash,
        merged.updatedAt,
        id,
      ],
    );
    persist();
    notifyChange();
    return merged;
  },
};

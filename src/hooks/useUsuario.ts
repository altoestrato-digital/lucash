"use client";

import { useCallback, useEffect, useState } from "react";
import type { Usuario, UsuarioInput } from "@/types/usuario";
import { USUARIO_DEFAULT_ID } from "@/types/usuario";
import { usuariosRepo, subscribe } from "@/lib/db";

const USUARIO_VACIO: Usuario = {
  id: USUARIO_DEFAULT_ID,
  nombre: "",
  contrasenaHash: "",
  createdAt: "",
  updatedAt: "",
};

export function useUsuario() {
  const [usuario, setUsuario] = useState<Usuario>(() => usuariosRepo.getActivo() ?? USUARIO_VACIO);

  useEffect(() => {
    return subscribe(() => {
      setUsuario(usuariosRepo.getActivo() ?? USUARIO_VACIO);
    });
  }, []);

  const updateUsuario = useCallback((data: Partial<UsuarioInput>) => {
    return usuariosRepo.update(USUARIO_DEFAULT_ID, data);
  }, []);

  return { usuario, updateUsuario };
}

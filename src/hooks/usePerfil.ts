"use client";

import { useCallback, useEffect, useState } from "react";
import type { AvatarDataUrl, Perfil } from "@/types/perfil";
import { PREFERENCIAS_DEFAULT } from "@/types/perfil";
import { perfilRepo, subscribe } from "@/lib/db";

const PERFIL_VACIO: Perfil = {
  id: "perfil-local" as Perfil["id"],
  usuarioId: "default",
  nombre: "",
  preferencias: PREFERENCIAS_DEFAULT,
  createdAt: "",
  updatedAt: "",
};

function defaultPerfil(): Perfil {
  return { ...PERFIL_VACIO, preferencias: { ...PREFERENCIAS_DEFAULT } };
}

export function usePerfil() {
  const [perfil, setPerfil] = useState<Perfil>(() => perfilRepo.get() ?? defaultPerfil());

  useEffect(() => {
    return subscribe(() => {
      const next = perfilRepo.get() ?? defaultPerfil();
      setPerfil(next);
    });
  }, []);

  const updatePerfil = useCallback((data: Partial<Perfil>) => {
    perfilRepo.upsert(data);
  }, []);

  const setAvatar = useCallback((avatar: AvatarDataUrl | undefined) => {
    perfilRepo.setAvatar(avatar);
  }, []);

  return { perfil, setPerfil, updatePerfil, setAvatar };
}

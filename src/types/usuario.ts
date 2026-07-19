export type UsuarioId = string & { readonly __brand: "UsuarioId" };

export interface Usuario {
  id: UsuarioId;
  nombre: string;
  email?: string;
  contrasenaHash: string;
  createdAt: string;
  updatedAt: string;
}

export type UsuarioInput = Omit<Usuario, "id" | "createdAt" | "updatedAt" | "contrasenaHash"> & {
  contrasena?: string;
  contrasenaHash?: string;
};

export const USUARIO_DEFAULT_ID = "default" as UsuarioId;

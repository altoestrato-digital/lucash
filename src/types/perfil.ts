export type PerfilId = string & { readonly __brand: "PerfilId" };
export type AvatarDataUrl = string & { readonly __brand: "AvatarDataUrl" };

export type MonedaPreferida = "Bs" | "USD";
export type FormatoFecha = "DD/MM/YYYY" | "MM/DD/YYYY";
export type InicioSemana = "lunes" | "domingo";
export type Tema = "claro" | "oscuro" | "auto";
export type Idioma = "es" | "en";
export type FuenteTasaPreferida = "oficial" | "paralelo";
export type CoberturaModo = "carteras-cubrir" | "ingreso-esperado";

export interface Preferencias {
  moneda: MonedaPreferida;
  formatoFecha: FormatoFecha;
  inicioSemana: InicioSemana;
  tema: Tema;
  idioma: Idioma;
  fuenteTasa: FuenteTasaPreferida;
  coberturaModo: CoberturaModo;
  espacioTrabajoId: string | null;
}

export interface Perfil {
  id: PerfilId;
  usuarioId: string;
  nombre: string;
  email?: string;
  avatar?: AvatarDataUrl;
  preferencias: Preferencias;
  createdAt: string;
  updatedAt: string;
}

export const PREFERENCIAS_DEFAULT: Preferencias = {
  moneda: "Bs",
  formatoFecha: "DD/MM/YYYY",
  inicioSemana: "lunes",
  tema: "auto",
  idioma: "es",
  fuenteTasa: "oficial",
  coberturaModo: "ingreso-esperado",
  espacioTrabajoId: null,
};

export const PERFIL_SEED: Perfil = {
  id: "perfil-local" as PerfilId,
  usuarioId: "default",
  nombre: "",
  preferencias: PREFERENCIAS_DEFAULT,
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
};

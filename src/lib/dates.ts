export type ISODate = string & { readonly __brand: "ISODate" };
export type ISODateTime = string & { readonly __brand: "ISODateTime" };

export const toIso = (d: Date): ISODate => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}` as ISODate;
};

export const toIsoDateTime = (d: Date): ISODateTime => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  return `${y}-${m}-${day}T${h}:${min}:${s}` as ISODateTime;
};

export const extractDate = (dt: ISODateTime | ISODate): ISODate => {
  return dt.slice(0, 10) as ISODate;
};

export const formatDate = (iso: ISODate, format: "DD/MM/YYYY" | "MM/DD/YYYY" = "DD/MM/YYYY"): string => {
  const [y, m, d] = iso.split("-");
  if (format === "MM/DD/YYYY") return `${m}/${d}/${y}`;
  return `${d}/${m}/${y}`;
};

export const formatDateShort = (iso: ISODate | ISODateTime): string => {
  const dateOnly = iso.includes("T") ? iso.slice(0, 10) : iso;
  const d = new Date(dateOnly + "T12:00:00");
  const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${d.getDate()} ${months[d.getMonth()]}`;
};

export const formatDateTime = (iso: ISODateTime): string => {
  const d = new Date(iso);
  const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const date = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "p. m." : "a. m.";
  hours = hours % 12 || 12;
  return `${date}, ${hours}:${minutes} ${ampm}`;
};

export const daysBetween = (a: ISODate, b: ISODate): number => {
  const da = new Date(a + "T12:00:00");
  const db = new Date(b + "T12:00:00");
  return Math.round((db.getTime() - da.getTime()) / (1000 * 60 * 60 * 24));
};

export const addDays = (iso: ISODate, days: number): ISODate => {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + days);
  return toIso(d);
};

export const getMonthName = (iso: ISODate): string => {
  const d = new Date(iso + "T12:00:00");
  const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  return months[d.getMonth()];
};

import type { Prioridad } from "@/types/presupuesto";

export const PRIORIDAD_LABELS: Record<Prioridad, string> = {
  1: "P1",
  2: "P2",
  3: "P3",
};

export const PRIORIDAD_BADGE_CLASSES: Record<Prioridad, string> = {
  1: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  2: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  3: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
};

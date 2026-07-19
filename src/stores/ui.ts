"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";

export type ToastTone = "info" | "success" | "warning" | "danger";

export interface Toast {
  id: string;
  tone: ToastTone;
  message: string;
  monto?: string;
  montoColor?: "green" | "red";
}

interface UIState {
  toasts: Toast[];
  pushToast: (toast: Omit<Toast, "id">) => string;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
}

const newId = () => `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const useUIStore = create<UIState>()(
  devtools(
    (set) => ({
      toasts: [],
      pushToast: (toast) => {
        const id = newId();
        set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
        return id;
      },
      dismissToast: (id) => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
      },
      clearToasts: () => {
        set({ toasts: [] });
      },
    }),
    { name: "lucash/ui" },
  ),
);

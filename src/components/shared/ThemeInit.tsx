"use client";

import { useEffect } from "react";

export function ThemeInit() {
  useEffect(() => {
    try {
      const raw = localStorage.getItem("lucash:perfil");
      if (!raw) return;
      const perfil = JSON.parse(raw);
      const tema = perfil?.preferencias?.tema || "auto";
      if (tema === "oscuro" || (tema === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
        document.documentElement.classList.add("dark");
      }
    } catch {
      /* empty */
    }
  }, []);

  return null;
}

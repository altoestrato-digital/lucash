"use client";

import { useState } from "react";
import { FileText, Shield, BookOpen } from "lucide-react";
import LegalModal from "./LegalModal";

export default function AcercaDeTab() {
  const [legal, setLegal] = useState<{ open: boolean; title: string }>({
    open: false,
    title: "",
  });

  const links = [
    { label: "Términos y condiciones", icon: FileText, action: () => setLegal({ open: true, title: "Términos y condiciones" }) },
    { label: "Política de privacidad", icon: Shield, action: () => setLegal({ open: true, title: "Política de privacidad" }) },
    { label: "Documentación", icon: BookOpen, action: () => window.open("https://docs.lucash.app", "_blank") },
  ];

  return (
    <div className="flex flex-col items-center gap-6 px-4 py-10">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25">
        <span className="text-3xl font-bold text-white">L</span>
      </div>

      <p className="text-sm text-muted">Versión 0.1.0</p>

      <div className="w-full space-y-1">
        {links.map((link) => (
          <button
            key={link.label}
            onClick={link.action}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-foreground hover:bg-surface-elevated transition-colors"
          >
            <link.icon className="h-4 w-4 text-muted" />
            {link.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-muted text-center">
        Hecho con amor en Venezuela
      </p>

      <LegalModal
        open={legal.open}
        title={legal.title}
        onClose={() => setLegal({ open: false, title: "" })}
      />
    </div>
  );
}

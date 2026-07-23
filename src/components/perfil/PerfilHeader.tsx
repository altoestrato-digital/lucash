"use client";

import { User } from "lucide-react";
import PerfilTabs from "./PerfilTabs";

interface PerfilHeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function PerfilHeader({ activeTab, onTabChange }: PerfilHeaderProps) {
  return (
    <div className="relative bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 pt-12 pb-0 px-6">
      <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/5" />
      <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-white/5" />
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
            <User className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Perfil</h1>
        </div>
      </div>
      <PerfilTabs active={activeTab} onChange={onTabChange} />
    </div>
  );
}

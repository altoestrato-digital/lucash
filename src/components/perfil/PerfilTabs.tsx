"use client";

const TABS = ["Cuenta", "Preferencias", "Sincronización", "Acerca de"];

interface PerfilTabsProps {
  active: string;
  onChange: (tab: string) => void;
}

export default function PerfilTabs({ active, onChange }: PerfilTabsProps) {
  return (
    <div className="flex w-full">
      {TABS.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={`flex-1 min-w-0 px-3 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-200 touch-manipulation ${
            active === tab
              ? "border-white text-white"
              : "border-transparent text-emerald-200/70 active:text-white"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

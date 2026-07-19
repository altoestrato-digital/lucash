"use client";

interface CarterasTabsProps {
  active: string;
  onChange: (tab: string) => void;
}

const TABS = ["Todas", "Disponibles", "Ahorro"];

export default function CarterasTabs({ active, onChange }: CarterasTabsProps) {
  return (
    <div className="px-4 pb-3" role="tablist" aria-label="Filtro de carteras">
      <div className="flex rounded-xl bg-surface border border-border p-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={active === tab}
            onClick={() => onChange(tab)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
              active === tab
                ? "bg-primary text-white shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
}

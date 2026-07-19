"use client";

const colores = [
  "#10B981", "#3B82F6", "#8B5CF6", "#F97316",
  "#EF4444", "#F59E0B", "#6366F1", "#EC4899",
  "#14B8A6", "#60A5FA", "#A78BFA", "#FB923C",
  "#F87171", "#FBBF24", "#818CF8", "#F472B6",
];

export default function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  const isCustom = value && !colores.includes(value);

  return (
    <div className="space-y-3" role="radiogroup" aria-label="Color">
      <div className="grid grid-cols-8 gap-2">
        {colores.map((c) => (
          <button
            key={c}
            role="radio"
            aria-checked={value === c}
            type="button"
            onClick={() => onChange(c)}
            className={`h-7 w-7 rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-400 dark:focus:ring-offset-zinc-900 ${value === c ? "ring-2 ring-zinc-500 ring-offset-2 dark:ring-offset-zinc-900 scale-110" : ""}`}
            style={{ backgroundColor: c }}
          >
            {value === c && (
              <svg className="w-4 h-4 text-white mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <label className="relative h-7 w-7 cursor-pointer">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-dashed border-zinc-400 text-xs text-zinc-500 dark:border-zinc-500 dark:text-zinc-400 ${isCustom ? "ring-2 ring-zinc-500 ring-offset-2 dark:ring-offset-zinc-900" : ""}`}
            style={{ backgroundColor: isCustom ? value : undefined }}
          >
            {isCustom ? "" : "+"}
          </span>
        </label>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {isCustom ? value : "Color personalizado"}
        </span>
      </div>
    </div>
  );
}

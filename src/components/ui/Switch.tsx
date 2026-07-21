"use client";

export default function Switch({
  checked,
  onChange,
  label,
  description,
  className = "",
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      {(label || description) && (
        <div>
          {label && <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</label>}
          {description && <p className="text-xs text-zinc-500 dark:text-zinc-400">{description}</p>}
        </div>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors ${
          checked ? "bg-zinc-900 dark:bg-zinc-100" : "bg-zinc-300 dark:bg-zinc-600"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white dark:bg-zinc-900 transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

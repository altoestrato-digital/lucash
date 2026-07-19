"use client";

import type { ReactNode } from "react";

interface ColorBorderCardProps {
  color: string;
  onClick?: () => void;
  className?: string;
  children: ReactNode;
}

export default function ColorBorderCard({
  color,
  onClick,
  className = "",
  children,
}: ColorBorderCardProps) {
  const interactive = Boolean(onClick);
  return (
    <div
      onClick={onClick}
      style={{ borderColor: color }}
      className={[
        "relative mx-4 mb-3 rounded-2xl border-2 bg-surface p-5 lg:mx-0",
        "transition-all duration-300",
        interactive
          ? "cursor-pointer hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]"
          : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}

"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900",
  secondary:
    "border border-zinc-300 hover:bg-zinc-50 text-zinc-700 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800",
  danger:
    "bg-danger hover:bg-danger/90 text-white",
  ghost:
    "hover:bg-zinc-100 text-zinc-700 dark:hover:bg-zinc-800 dark:text-zinc-300",
};

const SIZES: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-4 py-3 text-sm",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", fullWidth, className = "", type = "button", children, ...rest },
  ref,
) {
  const widthClass = fullWidth ? "w-full" : "";
  return (
    <button
      ref={ref}
      type={type}
      className={`rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${widthClass} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
});

export default Button;

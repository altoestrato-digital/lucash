"use client";

import { useEffect, type ReactNode } from "react";

type Variant = "modal" | "drawer";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  ariaLabel: string;
  variant?: Variant;
  className?: string;
  children: ReactNode;
}

export default function Modal({
  open,
  onClose,
  ariaLabel,
  variant = "modal",
  className = "",
  children,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const isModal = variant === "modal";
  const backdropClass = isModal
    ? "fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
    : "fixed inset-0 z-50 flex bg-black/50 backdrop-blur-sm";

  const panelClass = isModal
    ? `w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-white dark:bg-zinc-900 p-6 max-h-[85vh] overflow-y-auto border border-zinc-200 dark:border-zinc-700 ${className}`
    : `w-full max-h-[80vh] overflow-y-auto rounded-t-2xl bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-700 px-4 pb-8 pt-6 ${className}`;

  return (
    <div className={backdropClass} onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className={panelClass}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

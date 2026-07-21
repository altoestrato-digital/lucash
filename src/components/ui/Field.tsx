"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

const FIELD_CLASS =
  "w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-zinc-400 focus:border-zinc-500 dark:focus:border-zinc-400 transition-colors";

interface FieldProps {
  label?: ReactNode;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}

export function Field({ label, hint, error, className = "", children }: FieldProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</label>}
      {children}
      {hint && !error && <p className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>}
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  inputClassName?: string;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { className = "", inputClassName = "", ...rest },
  ref,
) {
  return <input ref={ref} className={`${FIELD_CLASS} ${inputClassName} ${className}`} {...rest} />;
});

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  selectClassName?: string;
  children: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className = "", selectClassName = "", children, ...rest },
  ref,
) {
  return (
    <select ref={ref} className={`${FIELD_CLASS} ${selectClassName} ${className}`} {...rest}>
      {children}
    </select>
  );
});

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  textareaClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className = "", textareaClassName = "", ...rest },
  ref,
) {
  return <textarea ref={ref} className={`${FIELD_CLASS} resize-none ${textareaClassName} ${className}`} {...rest} />;
});

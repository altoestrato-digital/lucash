"use client";

import { useEffect, useState, type ReactNode } from "react";
import { initDB, isDBReady } from "./client";

interface DBProviderProps {
  children: ReactNode;
  fallback?: ReactNode;
  errorFallback?: (error: Error) => ReactNode;
}

export function DBProvider({ children, fallback, errorFallback }: DBProviderProps) {
  const [ready, setReady] = useState(() => isDBReady());
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    initDB()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e : new Error(String(e)));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      errorFallback?.(error) ?? (
        <div className="flex min-h-screen items-center justify-center p-6">
          <div className="max-w-sm rounded-2xl border border-danger/30 bg-danger/10 p-6 text-center">
            <p className="text-sm font-semibold text-danger">No se pudo abrir la base local</p>
            <p className="mt-2 text-xs text-muted">{error.message}</p>
          </div>
        </div>
      )
    );
  }

  if (!ready || !isDBReady()) {
    return (
      fallback ?? (
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-muted">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            Abriendo base de datos local…
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
}

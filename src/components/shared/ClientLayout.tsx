"use client";

import { usePathname } from "next/navigation";
import { NavBar } from "@/components/shared/NavBar";
import { DolarApiBootstrap } from "@/components/shared/DolarApiBootstrap";
import { DBProvider } from "@/lib/db";
import ToastRenderer from "@/components/shared/ToastRenderer";
import FloatingToggles from "@/components/shared/FloatingToggles";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isRoot = pathname === "/";
  const hideNav = isRoot;

  return (
    <DBProvider>
      <DolarApiBootstrap />
      <ToastRenderer />
      {!hideNav && <FloatingToggles />}
      <main className="min-h-screen w-full overflow-x-hidden pb-20 lg:pb-6 lg:pl-20">
        {children}
      </main>
      {!hideNav && <NavBar />}
    </DBProvider>
  );
}

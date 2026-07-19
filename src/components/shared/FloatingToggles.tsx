"use client";

import DolarToggle from "@/components/shared/DolarToggle";
import MonedaToggle from "@/components/shared/MonedaToggle";

export default function FloatingToggles() {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-1.5">
      <DolarToggle />
      <MonedaToggle />
    </div>
  );
}

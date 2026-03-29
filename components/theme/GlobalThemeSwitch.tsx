"use client";

import { ThemeSwitch } from "@/components/theme/ThemeSwitch";

export function GlobalThemeSwitch() {
  return (
    <div className="fixed bottom-4 right-4 z-40 rounded-md border border-zinc-200 bg-white/90 px-2 py-1 shadow-sm backdrop-blur dark:border-zinc-700 dark:bg-zinc-950/90">
      <ThemeSwitch />
    </div>
  );
}

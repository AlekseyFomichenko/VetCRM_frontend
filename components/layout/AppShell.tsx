"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { DashboardSidebar } from "@/components/layout/DashboardSidebar";

export function AppShell({ children }: Readonly<{ children: ReactNode }>) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const role = typeof session?.role === "string" ? session.role : null;

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (!pathname.startsWith("/app/admin")) return;
    if (role !== "Admin") router.replace("/app/appointments");
  }, [pathname, role, router, status]);

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-black">
      <div className="hidden lg:block">
        <DashboardSidebar />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-zinc-200 bg-white px-3 dark:border-zinc-800 dark:bg-zinc-950 lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
            aria-label="Открыть меню"
          >
            Меню
          </button>
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            VetCRM
          </div>
        </header>

        <main className="flex-1 p-4">{children}</main>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="relative h-full w-72 bg-white dark:bg-zinc-950">
            <div className="flex items-center justify-between border-b border-zinc-200 p-3 dark:border-zinc-800">
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Меню
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-zinc-200 px-2 py-1 text-sm text-zinc-800 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900"
              >
                Закрыть
              </button>
            </div>
            <DashboardSidebar />
          </div>
        </div>
      ) : null}
    </div>
  );
}


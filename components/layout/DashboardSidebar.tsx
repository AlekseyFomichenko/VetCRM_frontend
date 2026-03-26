"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

import { ThemeSwitch } from "@/components/theme/ThemeSwitch";

export function DashboardSidebar() {
  const { data: session } = useSession();
  const role = typeof session?.role === "string" ? session.role : null;
  const canAdmin = role === "Admin";

  return (
    <aside className="flex w-72 shrink-0 flex-col gap-6 border-r border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center justify-between gap-3">
        <div className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          VetCRM
        </div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400">CRM</div>
      </div>

      <nav className="flex flex-col gap-1">
        <Link
          href="/app/appointments"
          className="rounded-md px-2 py-1 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
        >
          Приёмы
        </Link>
        <Link
          href="/app/clients"
          className="rounded-md px-2 py-1 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
        >
          Клиенты
        </Link>
        <Link
          href="/app/pets"
          className="rounded-md px-2 py-1 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
        >
          Питомцы
        </Link>
        <Link
          href="/app/medical-records"
          className="rounded-md px-2 py-1 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
        >
          Медкарты
        </Link>
        {canAdmin ? (
          <>
            <Link
              href="/app/admin/users"
              className="rounded-md px-2 py-1 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
            >
              Пользователи
            </Link>
            <Link
              href="/app/admin/reports"
              className="rounded-md px-2 py-1 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
            >
              Отчеты
            </Link>
            <Link
              href="/app/admin/notifications"
              className="rounded-md px-2 py-1 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
            >
              Уведомления
            </Link>
          </>
        ) : null}
      </nav>

      <div className="mt-auto flex flex-col gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <ThemeSwitch />
        <div className="text-xs text-zinc-500 dark:text-zinc-400">
          Переключатель темы работает для всего dashboard.
        </div>
      </div>
    </aside>
  );
}


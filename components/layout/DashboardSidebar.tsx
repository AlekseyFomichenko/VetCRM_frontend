"use client";

import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  BarChart3,
  Bell,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  LogOut,
  PawPrint,
  Users,
  UsersRound,
} from "lucide-react";

type DashboardSidebarProps = {
  variant?: "desktop" | "drawer";
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
};

function NavItem({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
}: Readonly<{
  href: string;
  label: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  active: boolean;
  collapsed: boolean;
}>) {
  return (
    <Link
      href={href}
      aria-label={collapsed ? label : undefined}
      title={collapsed ? label : undefined}
      className={`group flex items-center rounded-lg text-sm font-medium transition-colors ${
        collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5"
      } ${
        active
          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
          : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800/80"
      }`}
    >
      <Icon
        className={`h-[1.125rem] w-[1.125rem] shrink-0 ${
          active
            ? "text-white dark:text-zinc-900"
            : "text-zinc-500 group-hover:text-zinc-700 dark:text-zinc-500 dark:group-hover:text-zinc-300"
        }`}
        strokeWidth={2}
        aria-hidden
      />
      <span className={collapsed ? "sr-only" : "truncate"}>{label}</span>
    </Link>
  );
}

function NavSection({
  title,
  children,
  collapsed,
}: Readonly<{ title: string; children: ReactNode; collapsed: boolean }>) {
  return (
    <div
      className={`flex flex-col gap-1 border-t border-zinc-100 dark:border-zinc-800/60 ${
        collapsed ? "pt-3 first:border-t-0 first:pt-0" : "pt-4 first:border-t-0 first:pt-0"
      }`}
    >
      <div
        className={
          collapsed
            ? "sr-only"
            : "px-3 pb-1 text-[0.65rem] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500"
        }
      >
        {title}
      </div>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

function isActivePath(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href !== "/app" && pathname.startsWith(`${href}/`)) return true;
  return false;
}

export function DashboardSidebar({
  variant = "desktop",
  collapsed = false,
  onToggleCollapsed,
}: Readonly<DashboardSidebarProps>) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = typeof session?.role === "string" ? session.role : null;
  const canAdmin = role === "Admin";
  const email =
    typeof session?.user?.email === "string" ? session.user.email : null;

  const isDrawer = variant === "drawer";
  const narrow = !isDrawer && collapsed;

  const onLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <aside
      className={`flex shrink-0 flex-col border-zinc-200 bg-white transition-[width] duration-200 ease-out dark:border-zinc-800 dark:bg-zinc-950 ${
        isDrawer
          ? "h-full min-h-0 w-64 border-0"
          : narrow
            ? "h-screen min-h-0 w-[4.25rem] border-r"
            : "h-screen min-h-0 w-64 border-r"
      }`}
    >
      {variant === "desktop" ? (
        <div
          className={`flex shrink-0 items-center border-b border-zinc-200 dark:border-zinc-800 ${
            narrow ? "flex-col gap-2 px-2 py-4" : "gap-3 px-4 py-5"
          }`}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-sm font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
            V
          </div>
          {!narrow ? (
            <div className="min-w-0 flex-1">
              <div className="truncate text-base font-semibold text-zinc-900 dark:text-zinc-50">
                VetCRM
              </div>
              <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                Клиника
              </div>
            </div>
          ) : null}
          {onToggleCollapsed ? (
            <button
              type="button"
              onClick={onToggleCollapsed}
              className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 ${
                narrow ? "" : "ml-auto"
              }`}
              aria-label={narrow ? "Развернуть меню" : "Свернуть меню"}
            >
              {narrow ? (
                <ChevronRight className="h-4 w-4" strokeWidth={2} aria-hidden />
              ) : (
                <ChevronLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
              )}
            </button>
          ) : null}
        </div>
      ) : (
        <div className="shrink-0 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Разделы
          </div>
        </div>
      )}

      <nav
        className={`flex min-h-0 flex-1 flex-col overflow-y-auto py-4 ${
          narrow ? "px-2" : "px-3"
        }`}
      >
        <NavSection title="Работа" collapsed={narrow}>
          <NavItem
            href="/app/appointments"
            label="Приёмы"
            icon={CalendarDays}
            active={isActivePath(pathname, "/app/appointments")}
            collapsed={narrow}
          />
          <NavItem
            href="/app/clients"
            label="Клиенты"
            icon={Users}
            active={isActivePath(pathname, "/app/clients")}
            collapsed={narrow}
          />
          <NavItem
            href="/app/pets"
            label="Питомцы"
            icon={PawPrint}
            active={isActivePath(pathname, "/app/pets")}
            collapsed={narrow}
          />
        </NavSection>

        {canAdmin ? (
          <NavSection title="Администрирование" collapsed={narrow}>
            <NavItem
              href="/app/admin/users"
              label="Пользователи"
              icon={UsersRound}
              active={isActivePath(pathname, "/app/admin/users")}
              collapsed={narrow}
            />
            <NavItem
              href="/app/admin/reports"
              label="Отчёты"
              icon={BarChart3}
              active={isActivePath(pathname, "/app/admin/reports")}
              collapsed={narrow}
            />
            <NavItem
              href="/app/admin/notifications"
              label="Уведомления"
              icon={Bell}
              active={isActivePath(pathname, "/app/admin/notifications")}
              collapsed={narrow}
            />
          </NavSection>
        ) : null}
      </nav>

      <div
        className={`shrink-0 border-t border-zinc-200 dark:border-zinc-800 ${
          narrow ? "p-2" : "p-3"
        }`}
      >
        {email && !narrow ? (
          <div
            className="mb-3 truncate px-1 text-xs text-zinc-500 dark:text-zinc-400"
            title={email}
          >
            {email}
          </div>
        ) : null}
        <button
          type="button"
          onClick={onLogout}
          aria-label="Выйти"
          title={narrow ? "Выйти" : undefined}
          className={`flex w-full items-center rounded-lg text-sm font-medium text-zinc-700 transition-colors hover:bg-rose-50 hover:text-rose-800 dark:text-zinc-300 dark:hover:bg-rose-950/40 dark:hover:text-rose-200 ${
            narrow ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5 text-left"
          }`}
        >
          <LogOut
            className="h-[1.125rem] w-[1.125rem] shrink-0 text-zinc-500 dark:text-zinc-500"
            strokeWidth={2}
            aria-hidden
          />
          <span className={narrow ? "sr-only" : ""}>Выйти</span>
        </button>
      </div>
    </aside>
  );
}

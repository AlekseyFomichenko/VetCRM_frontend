"use client";

import type { ReactNode } from "react";

export type StatusKind = "client" | "pet" | "appointment" | "user";

type StatusPillProps = {
  kind: StatusKind;
  value: number;
  fallbackLabel?: ReactNode;
};

function getClientLabel(value: number): string | null {
  if (value === 1) return "Активен";
  if (value === 2) return "Архивирован";
  return null;
}

function getPetLabel(value: number): string | null {
  if (value === 1) return "Активен";
  if (value === 2) return "Архивирован";
  if (value === 3) return "Павший";
  return null;
}

function getAppointmentLabel(value: number): string | null {
  if (value === 1) return "Запланирован";
  if (value === 2) return "Отменён";
  if (value === 3) return "Перенесён";
  if (value === 4) return "Завершён";
  if (value === 5) return "Не явился";
  return null;
}

function getUserLabel(value: number): string | null {
  if (value === 0) return "Активен";
  if (value === 1) return "Отключён";
  return null;
}

function getTone(kind: StatusKind, value: number): string {
  if (kind === "appointment") {
    if (value === 4) return "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200";
    if (value === 2) return "bg-rose-100 text-rose-900 dark:bg-rose-900/40 dark:text-rose-200";
    if (value === 1 || value === 3) return "bg-blue-100 text-blue-900 dark:bg-blue-900/40 dark:text-blue-200";
    return "bg-zinc-100 text-zinc-900 dark:bg-zinc-800/40 dark:text-zinc-100";
  }

  if (kind === "client" || kind === "pet") {
    if (value === 1) return "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200";
    if (value === 2) return "bg-zinc-100 text-zinc-900 dark:bg-zinc-800/40 dark:text-zinc-100";
    if (value === 3) return "bg-rose-100 text-rose-900 dark:bg-rose-900/40 dark:text-rose-200";
    return "bg-zinc-100 text-zinc-900 dark:bg-zinc-800/40 dark:text-zinc-100";
  }

  if (kind === "user") {
    if (value === 0) return "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200";
    if (value === 1) return "bg-rose-100 text-rose-900 dark:bg-rose-900/40 dark:text-rose-200";
    return "bg-zinc-100 text-zinc-900 dark:bg-zinc-800/40 dark:text-zinc-100";
  }

  return "bg-zinc-100 text-zinc-900 dark:bg-zinc-800/40 dark:text-zinc-100";
}

export function StatusPill({ kind, value, fallbackLabel }: Readonly<StatusPillProps>) {
  const label =
    kind === "client"
      ? getClientLabel(value)
      : kind === "pet"
        ? getPetLabel(value)
        : kind === "appointment"
          ? getAppointmentLabel(value)
          : kind === "user"
            ? getUserLabel(value)
            : null;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getTone(
        kind,
        value,
      )}`}
    >
      {label ?? fallbackLabel ?? value}
    </span>
  );
}


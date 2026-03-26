"use client";

import type { ReactNode } from "react";

type FilterBarProps = {
  children: ReactNode;
  onApply?: () => void;
  applyText?: string;
  onReset?: () => void;
  resetText?: string;
};

export function FilterBar({
  children,
  onApply,
  applyText = "Применить",
  onReset,
  resetText = "Сбросить",
}: FilterBarProps) {
  return (
    <div className="mb-4 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap items-end gap-3">{children}</div>
        <div className="flex items-center gap-2">
          {onReset ? (
            <button
              type="button"
              onClick={onReset}
              className="rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-800 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900"
            >
              {resetText}
            </button>
          ) : null}
          {onApply ? (
            <button
              type="button"
              onClick={onApply}
              className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              {applyText}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}


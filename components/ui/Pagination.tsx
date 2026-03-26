"use client";

import type { ChangeEvent } from "react";

type PaginationProps = {
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
};

function clamp(n: number, min: number, max: number): number {
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

export function Pagination({
  page,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [20, 50, 100],
}: Readonly<PaginationProps>) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const current = clamp(page, 1, totalPages);

  const canPrev = current > 1;
  const canNext = current < totalPages;

  const onPageSize = (e: ChangeEvent<HTMLSelectElement>) => {
    const v = Number(e.target.value);
    if (Number.isFinite(v)) onPageSizeChange?.(v);
  };

  return (
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(current - 1)}
          disabled={!canPrev}
          className="rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-800 disabled:opacity-50 dark:border-zinc-800 dark:text-zinc-200"
        >
          Назад
        </button>
        <button
          type="button"
          onClick={() => onPageChange(current + 1)}
          disabled={!canNext}
          className="rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-800 disabled:opacity-50 dark:border-zinc-800 dark:text-zinc-200"
        >
          Вперёд
        </button>
      </div>

      <div className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-200">
        <span>
          Страница {current} из {totalPages}
        </span>
        {onPageSizeChange ? (
          <label className="flex items-center gap-2">
            Показать
            <select
              className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
              value={pageSize}
              onChange={onPageSize}
            >
              {pageSizeOptions
                .filter((x) => x > 0)
                .map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
            </select>
          </label>
        ) : null}
      </div>
    </div>
  );
}


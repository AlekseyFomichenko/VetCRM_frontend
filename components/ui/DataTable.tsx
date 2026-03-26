"use client";

import type { ReactNode } from "react";

type Column<T> = {
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
};

type DataTableProps<T> = {
  columns: Array<Column<T>>;
  rows: T[];
  rowKey: (row: T) => string;
  empty?: ReactNode;
};

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  empty,
}: Readonly<DataTableProps<T>>) {
  if (rows.length === 0) return empty ?? null;

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead className="sticky top-0 bg-white dark:bg-zinc-950">
          <tr className="border-b border-zinc-200 dark:border-zinc-800">
            {columns.map((c, idx) => (
              <th
                key={idx}
                className={`px-3 py-2 font-semibold text-zinc-800 dark:text-zinc-100 ${c.className ?? ""}`}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className="border-b border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
            >
              {columns.map((c, idx) => (
                <td
                  key={idx}
                  className={`px-3 py-2 align-top text-zinc-700 dark:text-zinc-200 ${c.className ?? ""}`}
                >
                  {c.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


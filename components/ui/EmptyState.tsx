"use client";

import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: Readonly<EmptyStateProps>) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-950">
      <div className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
        {title}
      </div>
      {description ? (
        <div className="mt-2 text-sm text-zinc-700 dark:text-zinc-200">
          {description}
        </div>
      ) : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}


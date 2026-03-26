"use client";

import type { ReactNode } from "react";

export function LoadingSkeleton({ height = 16, width = "100%" }: Readonly<{ height?: number; width?: string | number }>) {
  return (
    <div
      aria-hidden="true"
      className="animate-pulse rounded bg-zinc-200 dark:bg-zinc-800"
      style={{ height, width }}
    />
  );
}

export function LoadingListSkeleton({ rows = 5 }: Readonly<{ rows?: number }>) {
  const items: ReactNode[] = [];
  for (let i = 0; i < rows; i += 1) {
    items.push(<LoadingSkeleton key={i} height={14} width="100%" />);
  }
  return <div className="flex flex-col gap-2">{items}</div>;
}


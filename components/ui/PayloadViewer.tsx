"use client";

import type { ReactNode } from "react";

type PayloadViewerProps = {
  payload: string;
  empty?: ReactNode;
};

export function PayloadViewer({ payload, empty = "—" }: Readonly<PayloadViewerProps>) {
  if (!payload) return <span>{empty}</span>;
  let content: string;
  try {
    const parsed: unknown = JSON.parse(payload);
    content = JSON.stringify(parsed, null, 2);
  } catch {
    content = payload;
  }

  return (
    <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-md border border-zinc-200 bg-white p-3 text-xs text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
      {content}
    </pre>
  );
}


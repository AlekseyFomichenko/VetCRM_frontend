"use client";

import type { ReactNode } from "react";

import type { NormalizedApiError } from "@/lib/api/errors";

type APIErrorBannerProps = {
  error: NormalizedApiError;
  action?: ReactNode;
};

export function APIErrorBanner({ error, action }: Readonly<APIErrorBannerProps>) {
  return (
    <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-900 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-100">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold">{error.title}</div>
          <div className="mt-1 text-xs opacity-80">
            Код: {error.type}, HTTP: {error.status}
            {error.traceId ? `, traceId: ${error.traceId}` : ""}
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}


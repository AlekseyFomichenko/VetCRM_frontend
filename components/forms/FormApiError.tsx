"use client";

import type { ReactNode } from "react";

import type { NormalizedApiError } from "@/lib/api/errors";

type FormApiErrorProps = {
  error?: NormalizedApiError | null;
  prefix?: ReactNode;
};

export function FormApiError({ error, prefix }: Readonly<FormApiErrorProps>) {
  if (!error) return null;
  return (
    <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-rose-900 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-100">
      <div className="text-sm font-semibold">{error.title}</div>
      <div className="mt-1 text-xs opacity-80">
        Код: {error.type}, HTTP: {error.status}
      </div>
      {prefix ? <div className="mt-2 text-sm">{prefix}</div> : null}
    </div>
  );
}


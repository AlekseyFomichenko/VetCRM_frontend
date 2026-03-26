"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { APIErrorBanner } from "@/components/ui/APIErrorBanner";
import { LoadingListSkeleton } from "@/components/ui/LoadingSkeleton";
import { DataTable } from "@/components/ui/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { FilterBar } from "@/components/ui/FilterBar";
import { apiClient } from "@/lib/api/client/apiClient";
import {
  AppointmentsReportResponseSchema,
  OverdueVaccinationsReportResponseSchema,
} from "@/lib/api/schemas";
import type { NormalizedApiError } from "@/lib/api/errors";

function isNormalizedApiError(value: unknown): value is NormalizedApiError {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.type === "string" &&
    typeof v.title === "string" &&
    typeof v.status === "number" &&
    "detail" in v &&
    ("traceId" in v || v.traceId === null) &&
    typeof v.isPlainText === "boolean"
  );
}

function toIsoDateTimeOrUndefined(value: string) {
  if (!value) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

export default function AdminReportsPage() {
  const { status } = useSession();

  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  const [applied, setApplied] = useState(false);

  const appointmentsQuery = useQuery({
    queryKey: ["admin_reports_appointments", { from, to, page, pageSize, applied }],
    enabled: status === "authenticated" && applied && !!from && !!to,
    queryFn: async () => {
      const params = {
        from: toIsoDateTimeOrUndefined(from),
        to: toIsoDateTimeOrUndefined(to),
        page,
        pageSize,
      };
      const res = await apiClient.get("/api/reports/appointments", { params });
      return AppointmentsReportResponseSchema.parse(res.data);
    },
  });

  const overdueQuery = useQuery({
    queryKey: ["admin_reports_overdue", { page, pageSize }],
    enabled: status === "authenticated",
    queryFn: async () => {
      const params = { page, pageSize };
      const res = await apiClient.get("/api/reports/overdue-vaccinations", { params });
      return OverdueVaccinationsReportResponseSchema.parse(res.data);
    },
  });

  const appointmentsError = isNormalizedApiError(appointmentsQuery.error)
    ? appointmentsQuery.error
    : null;
  const overdueError = isNormalizedApiError(overdueQuery.error) ? overdueQuery.error : null;

  if (status !== "authenticated") {
    return (
      <div className="mx-auto max-w-5xl">
        <LoadingListSkeleton rows={6} />
      </div>
    );
  }

  if (appointmentsError) {
    return (
      <div className="mx-auto max-w-5xl">
        <APIErrorBanner error={appointmentsError} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Отчёты
      </div>

      <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="text-sm font-semibold">Приёмы за период</div>

        <div className="mt-3">
          <FilterBar
            onApply={() => setApplied(true)}
            onReset={() => {
              setApplied(false);
              setFrom("");
              setTo("");
              setPage(1);
            }}
            applyText="Показать"
            resetText="Сбросить"
          >
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                С
              </span>
              <input
                type="datetime-local"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="h-10 w-56 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                По
              </span>
              <input
                type="datetime-local"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="h-10 w-56 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
              />
            </div>
          </FilterBar>
        </div>

        {appointmentsQuery.isLoading ? (
          <div className="mt-3">
            <LoadingListSkeleton rows={6} />
          </div>
        ) : appointmentsQuery.data ? (
          <div className="mt-3">
            <DataTable
              rowKey={(r) => r.id}
              rows={appointmentsQuery.data.items}
              columns={[
                { header: "Дата/время", cell: (r) => `${r.startsAt} - ${r.endsAt}` },
                {
                  header: "Статус",
                  cell: (r) => String(r.status),
                },
                { header: "Причина", cell: (r) => r.reason ?? "—" },
              ]}
            />

            <Pagination
              page={appointmentsQuery.data.page}
              pageSize={appointmentsQuery.data.pageSize}
              totalCount={appointmentsQuery.data.totalCount}
              onPageChange={(next) => setPage(next)}
            />
          </div>
        ) : (
          <div className="mt-3 text-sm text-zinc-600 dark:text-zinc-200">
            Выберите период и нажмите “Показать”.
          </div>
        )}
      </div>

      <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="text-sm font-semibold">Просроченные вакцинации</div>

        {overdueError ? (
          <div className="mt-3">
            <APIErrorBanner error={overdueError} />
          </div>
        ) : overdueQuery.isLoading ? (
          <div className="mt-3">
            <LoadingListSkeleton rows={6} />
          </div>
        ) : overdueQuery.data ? (
          <div className="mt-3">
            <DataTable
              rowKey={(r) => r.vaccinationId}
              rows={overdueQuery.data.items}
              columns={[
                { header: "Вакцина", cell: (r) => r.vaccineName },
                { header: "Следующая дата", cell: (r) => r.nextDueDate },
                { header: "Клиент", cell: (r) => r.clientFullName ?? "—" },
                { header: "Телефон", cell: (r) => r.clientPhone ?? "—" },
                { header: "Email", cell: (r) => r.clientEmail ?? "—" },
              ]}
            />

            <Pagination
              page={overdueQuery.data.page}
              pageSize={overdueQuery.data.pageSize}
              totalCount={overdueQuery.data.totalCount}
              onPageChange={(next) => setPage(next)}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}


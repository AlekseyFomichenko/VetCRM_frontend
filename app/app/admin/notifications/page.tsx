"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client/apiClient";
import {
  ProcessVaccinationRemindersResponseSchema,
  ReminderLogResponseSchema,
  ReminderTypeNumber,
  ReminderStatusNumber,
} from "@/lib/api/schemas";
import type { NormalizedApiError } from "@/lib/api/errors";

import { FilterBar } from "@/components/ui/FilterBar";
import { LoadingListSkeleton } from "@/components/ui/LoadingSkeleton";
import { APIErrorBanner } from "@/components/ui/APIErrorBanner";
import { DataTable } from "@/components/ui/DataTable";
import { PayloadViewer } from "@/components/ui/PayloadViewer";

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

export default function AdminNotificationsPage() {
  const { status } = useSession();

  const [type, setType] = useState<number | undefined>(undefined);
  const [notifStatus, setNotifStatus] = useState<number | undefined>(undefined);
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [applied, setApplied] = useState(false);

  const logQuery = useQuery({
    queryKey: ["admin_notifications_log", { type, notifStatus, from, to, applied }],
    enabled: status === "authenticated" && applied,
    queryFn: async () => {
      const params: { type?: number; status?: number; from?: string; to?: string } = {};
      if (typeof type === "number") params.type = type;
      if (typeof notifStatus === "number") params.status = notifStatus;

      const fromIso = toIsoDateTimeOrUndefined(from);
      const toIso = toIsoDateTimeOrUndefined(to);
      if (fromIso) params.from = fromIso;
      if (toIso) params.to = toIso;

      const res = await apiClient.get("/api/notifications/log", { params });
      const parsed = ReminderLogResponseSchema.array().parse(res.data);
      return parsed;
    },
  });

  const logError = isNormalizedApiError(logQuery.error) ? logQuery.error : null;

  const [sendState, setSendState] = useState<
    | { created: number; sent: number; failed: number; error: null }
    | { created: number; sent: number; failed: number; error: NormalizedApiError }
    | null
  >(null);

  const sendReminders = async () => {
    setSendState(null);
    try {
      const res = await apiClient.post("/api/notifications/send");
      const parsed = ProcessVaccinationRemindersResponseSchema.parse(res.data);
      setSendState({ created: parsed.created, sent: parsed.sent, failed: parsed.failed, error: null });
    } catch (e: unknown) {
      if (isNormalizedApiError(e)) {
        setSendState({ created: 0, sent: 0, failed: 0, error: e });
      }
    }
  };

  if (status !== "authenticated") {
    return (
      <div className="mx-auto max-w-5xl">
        <LoadingListSkeleton rows={6} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Уведомления
      </div>

      <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="text-sm font-semibold">Отправка напоминаний</div>
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => void sendReminders()}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            Отправить напоминания
          </button>
          {sendState ? (
            sendState.error ? (
              <div className="text-sm text-rose-700 dark:text-rose-200">{sendState.error.title}</div>
            ) : (
              <div className="text-sm text-zinc-700 dark:text-zinc-200">
                Создано: {sendState.created}, Отправлено: {sendState.sent}, Ошибки: {sendState.failed}
              </div>
            )
          ) : null}
        </div>
      </div>

      <div className="mt-6">
        <FilterBar
          onApply={() => setApplied(true)}
          onReset={() => {
            setApplied(false);
            setType(undefined);
            setNotifStatus(undefined);
            setFrom("");
            setTo("");
          }}
          applyText="Показать"
          resetText="Сбросить"
        >
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Тип</span>
            <select
              value={typeof type === "number" ? String(type) : ""}
              onChange={(e) => {
                const v = e.target.value;
                setType(v ? Number(v) : undefined);
              }}
              className="h-10 w-56 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
            >
              <option value="">Все</option>
              <option value={ReminderTypeNumber.VaccinationDue}>VaccinationDue</option>
              <option value={ReminderTypeNumber.AppointmentTomorrow}>AppointmentTomorrow</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Статус</span>
            <select
              value={typeof notifStatus === "number" ? String(notifStatus) : ""}
              onChange={(e) => {
                const v = e.target.value;
                setNotifStatus(v ? Number(v) : undefined);
              }}
              className="h-10 w-56 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
            >
              <option value="">Все</option>
              <option value={ReminderStatusNumber.Sent}>Sent</option>
              <option value={ReminderStatusNumber.Failed}>Failed</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">С</span>
            <input
              type="datetime-local"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="h-10 w-56 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">По</span>
            <input
              type="datetime-local"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="h-10 w-56 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </div>
        </FilterBar>
      </div>

      {logError ? (
        <div className="mt-4">
          <APIErrorBanner error={logError} />
        </div>
      ) : logQuery.isLoading ? (
        <div className="mt-4">
          <LoadingListSkeleton rows={6} />
        </div>
      ) : applied && logQuery.data ? (
        <div className="mt-4">
          <DataTable
            rowKey={(r) => r.id}
            rows={logQuery.data}
            columns={[
              { header: "Тип", cell: (r) => r.type },
              { header: "Канал", cell: (r) => r.channel },
              { header: "Статус", cell: (r) => r.status },
              {
                header: "Создан",
                cell: (r) => new Date(r.createdAt).toLocaleString(),
              },
              {
                header: "Payload",
                cell: (r) => <PayloadViewer payload={r.payload} />,
              },
            ]}
          />
        </div>
      ) : applied ? (
        <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
          Лог пуст.
        </div>
      ) : null}
    </div>
  );
}


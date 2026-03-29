"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { apiClient } from "@/lib/api/client/apiClient";
import {
  AppointmentResponseSchema,
  ClientResponseSchema,
  ClientStatusNumber,
  GetClientsResponseSchema,
  GetPetsResponseSchema,
  PetResponseSchema,
  VeterinarianOptionSchema,
  dateOnlySchema,
  guidSchema,
} from "@/lib/api/schemas";
import type { NormalizedApiError } from "@/lib/api/errors";

import { APIErrorBanner } from "@/components/ui/APIErrorBanner";
import { LoadingListSkeleton } from "@/components/ui/LoadingSkeleton";
import { StatusPill } from "@/components/ui/StatusPill";
import { Modal } from "@/components/ui/Modal";
import { FormApiError } from "@/components/forms/FormApiError";
import { RHFSelect } from "@/components/forms/RHFSelect";
import { RHFTextInput } from "@/components/forms/RHFTextInput";

function toDateOnlyString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toTimeString(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getMonthGrid(anchor: Date) {
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const first = new Date(year, month, 1);
  const startDay = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((startDay + daysInMonth) / 7) * 7;

  const cells: Array<{ date: Date; iso: string; isCurrentMonth: boolean }> = [];
  const startOffset = startDay;
  const gridStart = new Date(year, month, 1 - startOffset);

  for (let i = 0; i < totalCells; i += 1) {
    const cellDate = new Date(gridStart);
    cellDate.setDate(gridStart.getDate() + i);
    const iso = toDateOnlyString(cellDate);
    cells.push({
      date: cellDate,
      iso,
      isCurrentMonth: cellDate.getMonth() === month,
    });
  }

  return cells;
}

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

const createAppointmentSchema = z.object({
  petId: guidSchema,
  clientId: guidSchema,
  startsAt: z.string().min(1),
  endsAt: z.string().min(1),
  reason: z.string().optional(),
  veterinarianUserId: z.union([guidSchema, z.literal("")]).optional(),
});

type CreateAppointmentValues = z.infer<typeof createAppointmentSchema>;

function toIsoFromLocal(value: string): string {
  return new Date(value).toISOString();
}

export default function AppointmentsPage() {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();

  const myUserId = typeof session?.user?.id === "string" ? session.user.id : null;
  const role = typeof session?.role === "string" ? session.role : null;
  const canCreateAppointment = role === "Admin" || role === "Receptionist";

  const initialDate = useMemo(() => toDateOnlyString(new Date()), []);
  const [date, setDate] = useState(initialDate);

  const [selectedVetId, setSelectedVetId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createError, setCreateError] = useState<NormalizedApiError | null>(null);

  const vetId = useMemo(() => {
    if (role === "Veterinarian" && myUserId) return myUserId;
    if (selectedVetId) return selectedVetId;
    return undefined;
  }, [myUserId, role, selectedVetId]);

  const monthCells = useMemo(() => getMonthGrid(new Date(date)), [date]);

  const queryKey = useMemo(
    () => ["appointments", date, vetId ?? "all"],
    [date, vetId],
  );

  const { data, isLoading, error } = useQuery({
    queryKey,
    enabled: status === "authenticated" && dateOnlySchema.safeParse(date).success,
    queryFn: async () => {
      const params: { date: string; vetId?: string } = { date };
      if (vetId) params.vetId = vetId;

      const res = await apiClient.get("/api/appointments", { params });
      const parsed = AppointmentResponseSchema.array().parse(res.data);
      return parsed;
    },
  });
  const clientsQuery = useQuery({
    queryKey: ["appointments_create_clients"],
    enabled: status === "authenticated" && canCreateAppointment,
    queryFn: async () => {
      const res = await apiClient.get("/api/clients", {
        params: { page: 1, pageSize: 200, status: ClientStatusNumber.Active },
      });
      return GetClientsResponseSchema.parse(res.data);
    },
  });
  const veterinariansQuery = useQuery({
    queryKey: ["appointments_veterinarians"],
    enabled: status === "authenticated",
    queryFn: async () => {
      const res = await apiClient.get("/api/appointments/veterinarians");
      return z.array(VeterinarianOptionSchema).parse(res.data);
    },
  });

  const veterinarianLabelById = useMemo(() => {
    const m = new Map<string, string>();
    for (const v of veterinariansQuery.data ?? []) {
      m.set(v.id, v.fullName ?? v.email);
    }
    return m;
  }, [veterinariansQuery.data]);
  const createForm = useForm<CreateAppointmentValues>({
    resolver: zodResolver(createAppointmentSchema),
    defaultValues: {
      petId: "",
      clientId: "",
      startsAt: "",
      endsAt: "",
      reason: "",
      veterinarianUserId: "",
    },
  });

  const selectedClientId = createForm.watch("clientId");
  const selectedClientIdValid =
    typeof selectedClientId === "string" &&
    selectedClientId.length > 0 &&
    guidSchema.safeParse(selectedClientId).success;

  const petsForClientQuery = useQuery({
    queryKey: ["appointments_create_pets", selectedClientId],
    enabled:
      status === "authenticated" &&
      canCreateAppointment &&
      createOpen &&
      selectedClientIdValid,
    queryFn: async () => {
      const res = await apiClient.get("/api/pets", {
        params: {
          page: 1,
          pageSize: 200,
          status: 1,
          clientId: selectedClientId,
        },
      });
      return GetPetsResponseSchema.parse(res.data);
    },
  });

  useEffect(() => {
    createForm.setValue("petId", "");
  }, [selectedClientId, createForm]);

  const appointments = data ?? [];
  const uniquePetIds = useMemo(
    () => [...new Set(appointments.map((a) => a.petId))],
    [appointments],
  );
  const uniqueClientIds = useMemo(
    () => [...new Set(appointments.map((a) => a.clientId))],
    [appointments],
  );

  const petDetailQueries = useQueries({
    queries: uniquePetIds.map((petId) => ({
      queryKey: ["appointment-sidebar-pet", petId] as const,
      queryFn: async () => {
        const res = await apiClient.get(`/api/pets/${petId}`);
        return PetResponseSchema.parse(res.data);
      },
      enabled:
        status === "authenticated" &&
        uniquePetIds.length > 0 &&
        dateOnlySchema.safeParse(date).success,
    })),
  });

  const clientDetailQueries = useQueries({
    queries: uniqueClientIds.map((clientId) => ({
      queryKey: ["appointment-sidebar-client", clientId] as const,
      queryFn: async () => {
        const res = await apiClient.get(`/api/clients/${clientId}`);
        return ClientResponseSchema.parse(res.data);
      },
      enabled:
        status === "authenticated" &&
        uniqueClientIds.length > 0 &&
        dateOnlySchema.safeParse(date).success,
    })),
  });

  const petLabelById = useMemo(() => {
    const m = new Map<string, string>();
    for (let i = 0; i < uniquePetIds.length; i += 1) {
      const id = uniquePetIds[i];
      const pet = petDetailQueries[i]?.data;
      if (pet) m.set(id, `${pet.name} (${pet.species})`);
    }
    return m;
  }, [uniquePetIds, petDetailQueries]);

  const clientNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (let i = 0; i < uniqueClientIds.length; i += 1) {
      const id = uniqueClientIds[i];
      const client = clientDetailQueries[i]?.data;
      if (client) m.set(id, client.fullName);
    }
    return m;
  }, [uniqueClientIds, clientDetailQueries]);

  const normalizedError = isNormalizedApiError(error) ? error : null;
  const submitCreate = async (values: CreateAppointmentValues) => {
    setCreateError(null);
    try {
      const vetIdPayload =
        role === "Receptionist" &&
        typeof values.veterinarianUserId === "string" &&
        values.veterinarianUserId.length > 0 &&
        guidSchema.safeParse(values.veterinarianUserId).success
          ? values.veterinarianUserId
          : null;

      await apiClient.post("/api/appointments", {
        petId: values.petId,
        clientId: values.clientId,
        veterinarianUserId: vetIdPayload,
        startsAt: toIsoFromLocal(values.startsAt),
        endsAt: toIsoFromLocal(values.endsAt),
        reason: values.reason?.trim() === "" ? null : values.reason ?? null,
      });
      setCreateOpen(false);
      createForm.reset({
        petId: "",
        clientId: "",
        startsAt: "",
        endsAt: "",
        reason: "",
        veterinarianUserId: "",
      });
      await queryClient.invalidateQueries({ queryKey: ["appointments"] });
    } catch (e: unknown) {
      if (isNormalizedApiError(e)) setCreateError(e);
    }
  };

  if (status !== "authenticated") {
    return (
      <div className="mx-auto max-w-5xl">
        <LoadingListSkeleton rows={6} />
      </div>
    );
  }

  if (normalizedError) {
    return (
      <div className="mx-auto max-w-5xl">
        <APIErrorBanner error={normalizedError} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <div className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Приёмы
          </div>
          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-200">
            Выберите дату и при необходимости ветврача.
          </div>
        </div>
        {canCreateAppointment ? (
          <button
            type="button"
            onClick={() => {
              setCreateError(null);
              createForm.reset({
                petId: "",
                clientId: "",
                startsAt: "",
                endsAt: "",
                reason: "",
                veterinarianUserId: "",
              });
              setCreateOpen(true);
            }}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            Создать приём
          </button>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-700 dark:text-zinc-200">Дата</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </label>

          {role === "Veterinarian" ? null : (
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-zinc-700 dark:text-zinc-200">Ветврач</span>
              <select
                value={selectedVetId ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  setSelectedVetId(v ? v : null);
                }}
                className="h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
              >
                <option value="">Все ветврачи</option>
                {myUserId ? <option value={myUserId}>Мой</option> : null}
              </select>
            </label>
          )}
        </div>
      </div>

      <Modal
        open={createOpen}
        title="Создать приём"
        onClose={() => {
          setCreateOpen(false);
          setCreateError(null);
        }}
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setCreateOpen(false);
                setCreateError(null);
              }}
              className="rounded-md border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900/40"
            >
              Отмена
            </button>
            <button
              type="submit"
              form="create-appointment-form"
              className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              Создать
            </button>
          </div>
        }
      >
        <form
          id="create-appointment-form"
          onSubmit={createForm.handleSubmit(async (values) => submitCreate(values))}
          className="flex flex-col gap-4"
        >
          {createError ? <FormApiError error={createError} /> : null}
          <RHFSelect
            control={createForm.control}
            name="clientId"
            label="Клиент"
            placeholder="Сначала выберите клиента"
            options={(clientsQuery.data?.items ?? []).map((c) => ({
              value: c.id,
              label: c.fullName,
            }))}
            selectProps={{ disabled: clientsQuery.isLoading }}
          />
          <RHFSelect
            control={createForm.control}
            name="petId"
            label="Питомец"
            placeholder={
              !selectedClientIdValid
                ? "Выберите клиента выше"
                : petsForClientQuery.isLoading
                  ? "Загрузка…"
                  : (petsForClientQuery.data?.items.length ?? 0) === 0
                    ? "Нет питомцев у этого клиента"
                    : "Выберите питомца"
            }
            options={
              !selectedClientIdValid || petsForClientQuery.isLoading
                ? []
                : (petsForClientQuery.data?.items ?? []).map((p) => ({
                    value: p.id,
                    label: `${p.name} (${p.species})`,
                  }))
            }
            selectProps={{
              disabled:
                !selectedClientIdValid ||
                petsForClientQuery.isLoading ||
                (petsForClientQuery.data?.items.length ?? 0) === 0,
            }}
          />
          <RHFTextInput
            control={createForm.control}
            name="startsAt"
            label="Начало"
            inputProps={{ type: "datetime-local" }}
          />
          <RHFTextInput
            control={createForm.control}
            name="endsAt"
            label="Окончание"
            inputProps={{ type: "datetime-local" }}
          />
          <RHFTextInput
            control={createForm.control}
            name="reason"
            label="Причина (опционально)"
            placeholder="Причина приёма"
          />
          {role === "Receptionist" ? (
            <RHFSelect
              control={createForm.control}
              name="veterinarianUserId"
              label="Врач"
              placeholder={
                veterinariansQuery.isLoading
                  ? "Загрузка…"
                  : "Не назначен"
              }
              options={(veterinariansQuery.data ?? []).map((v) => ({
                value: v.id,
                label: v.fullName ?? v.email,
              }))}
              selectProps={{ disabled: veterinariansQuery.isLoading }}
            />
          ) : null}
        </form>
      </Modal>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-zinc-600 dark:text-zinc-300">
            {["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-7 gap-2">
            {monthCells.map((cell) => {
              const isSelected = cell.iso === date;
              return (
                <button
                  type="button"
                  key={cell.iso}
                  onClick={() => setDate(cell.iso)}
                  className={`rounded-md border px-2 py-2 text-sm transition-colors ${
                    isSelected
                      ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-950"
                      : cell.isCurrentMonth
                        ? "border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900/40"
                        : "border-zinc-100 bg-zinc-50 text-zinc-400 dark:border-zinc-900/60 dark:bg-zinc-950/50 dark:text-zinc-600"
                  }`}
                >
                  {cell.date.getDate()}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Приёмы на {date}
          </div>

          {isLoading ? (
            <div className="mt-3">
              <LoadingListSkeleton rows={5} />
            </div>
          ) : appointments.length === 0 ? (
            <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-200">
              Ничего не найдено.
            </div>
          ) : (
            <div className="mt-3 flex flex-col gap-3">
              {appointments.map((a) => (
                <div
                  key={a.id}
                  className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        {toTimeString(a.startsAt)} - {toTimeString(a.endsAt)}
                      </div>
                      <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
                        Питомец:{" "}
                        {petLabelById.get(a.petId) ??
                          (petDetailQueries[
                            uniquePetIds.indexOf(a.petId)
                          ]?.isLoading
                            ? "…"
                            : a.petId)}
                        {" • "}
                        Клиент:{" "}
                        {clientNameById.get(a.clientId) ??
                          (clientDetailQueries[
                            uniqueClientIds.indexOf(a.clientId)
                          ]?.isLoading
                            ? "…"
                            : a.clientId)}
                      </div>
                      <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
                        Врач:{" "}
                        {a.veterinarianUserId === null
                          ? "Не назначен"
                          : veterinarianLabelById.get(a.veterinarianUserId) ??
                            (veterinariansQuery.isLoading
                              ? "…"
                              : a.veterinarianUserId)}
                      </div>
                      {a.reason ? (
                        <div className="mt-2 line-clamp-2 text-sm text-zinc-700 dark:text-zinc-200">
                          {a.reason}
                        </div>
                      ) : (
                        <div className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                          —
                        </div>
                      )}
                    </div>
                    <div className="shrink-0">
                      <StatusPill kind="appointment" value={a.status} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


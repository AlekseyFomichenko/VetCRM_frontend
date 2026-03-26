"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { apiClient } from "@/lib/api/client/apiClient";
import {
  ClientResponseSchema,
  ClientStatusNumber,
  GetClientsResponseSchema,
} from "@/lib/api/schemas";
import type { NormalizedApiError } from "@/lib/api/errors";

import { RHFTextInput } from "@/components/forms/RHFTextInput";
import { FormApiError } from "@/components/forms/FormApiError";
import { RHFTextArea } from "@/components/forms/RHFTextArea";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CardGrid } from "@/components/ui/CardGrid";
import { FilterBar } from "@/components/ui/FilterBar";
import { Pagination } from "@/components/ui/Pagination";
import { StatusPill } from "@/components/ui/StatusPill";
import { LoadingListSkeleton } from "@/components/ui/LoadingSkeleton";
import { APIErrorBanner } from "@/components/ui/APIErrorBanner";

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

type ClientFilters = {
  search: string;
  status: number | undefined;
  page: number;
  pageSize: number;
};

type CreateClientValues = z.infer<typeof createClientSchema>;

const createClientSchema = z.object({
  fullName: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().nullable().optional(),
  address: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export default function ClientsPage() {
  const { data: session, status } = useSession();
  const role = typeof session?.role === "string" ? session.role : null;

  const queryClient = useQueryClient();

  const [searchDraft, setSearchDraft] = useState("");
  const [filters, setFilters] = useState<ClientFilters>({
    search: "",
    status: undefined,
    page: 1,
    pageSize: 20,
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiveId, setArchiveId] = useState<string | null>(null);
  const [formError, setFormError] = useState<NormalizedApiError | null>(null);

  const canCreate = role === "Admin" || role === "Receptionist";
  const canArchive = role === "Admin" || role === "Receptionist";

  const query = useQuery({
    queryKey: ["clients", filters],
    enabled: status === "authenticated",
    queryFn: async () => {
      const params: {
        search?: string;
        status?: number;
        page: number;
        pageSize: number;
      } = {
        page: filters.page,
        pageSize: filters.pageSize,
      };
      if (filters.search.trim().length > 0) params.search = filters.search.trim();
      if (typeof filters.status === "number") params.status = filters.status;

      const res = await apiClient.get("/api/clients", { params });
      return GetClientsResponseSchema.parse(res.data);
    },
  });

  const onApplyFilters = () => {
    setFilters((f) => ({
      ...f,
      search: searchDraft,
      page: 1,
    }));
  };

  const onResetFilters = () => {
    setSearchDraft("");
    setFilters({
      search: "",
      status: undefined,
      page: 1,
      pageSize: 20,
    });
  };


  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<z.infer<typeof createClientSchema>>({
    resolver: zodResolver(createClientSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: null,
      address: null,
      notes: null,
    },
  });

  const submitCreate = async (values: CreateClientValues) => {
    setFormError(null);
    const payload = {
      fullName: values.fullName,
      phone: values.phone,
      email: values.email ?? null,
      address: values.address ?? null,
      notes: values.notes ?? null,
    };

    try {
      await apiClient.post("/api/clients", payload);
      setCreateOpen(false);
      reset();
      await queryClient.invalidateQueries({ queryKey: ["clients"] });
    } catch (e: unknown) {
      if (isNormalizedApiError(e)) setFormError(e);
      else setFormError(null);
    }
  };

  const submitEdit = async (values: CreateClientValues) => {
    if (!editId) return;
    setFormError(null);
    const payload = {
      fullName: values.fullName,
      phone: values.phone,
      email: values.email ?? null,
      address: values.address ?? null,
      notes: values.notes ?? null,
    };

    try {
      await apiClient.put(`/api/clients/${editId}`, payload);
      setEditOpen(false);
      setEditId(null);
      reset();
      await queryClient.invalidateQueries({ queryKey: ["clients"] });
    } catch (e: unknown) {
      if (isNormalizedApiError(e)) setFormError(e);
      else setFormError(null);
    }
  };

  const archiveClient = async () => {
    if (!archiveId) return;
    setFormError(null);
    try {
      await apiClient.post(`/api/clients/${archiveId}/archive`);
      setArchiveOpen(false);
      setArchiveId(null);
      await queryClient.invalidateQueries({ queryKey: ["clients"] });
    } catch (e: unknown) {
      if (isNormalizedApiError(e)) setFormError(e);
      setArchiveOpen(false);
      setArchiveId(null);
    }
  };

  const openEditWithValues = (client: z.infer<typeof ClientResponseSchema>) => {
    setFormError(null);
    setEditId(client.id);
    reset({
      fullName: client.fullName,
      phone: client.phone,
      email: client.email ?? null,
      address: client.address ?? null,
      notes: client.notes ?? null,
    });
    setEditOpen(true);
  };

  const clients = query.data?.items ?? [];

  if (status !== "authenticated") {
    return (
      <div className="mx-auto max-w-5xl">
        <LoadingListSkeleton rows={6} />
      </div>
    );
  }

  if (query.error && isNormalizedApiError(query.error)) {
    return (
      <div className="mx-auto max-w-5xl">
        <APIErrorBanner error={query.error} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Клиенты
          </div>
          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-200">
            Поиск, фильтры и управление карточками.
          </div>
        </div>
        {canCreate ? (
          <button
            type="button"
            onClick={() => {
              setFormError(null);
              reset({
                fullName: "",
                phone: "",
                email: null,
                address: null,
                notes: null,
              });
              setCreateOpen(true);
            }}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            Добавить клиента
          </button>
        ) : null}
      </div>

      <div className="mt-4">
        <FilterBar onApply={onApplyFilters} onReset={onResetFilters} applyText="Применить" resetText="Сбросить">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
              Поиск
            </span>
            <input
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              className="h-10 w-64 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
              placeholder="Имя, телефон..."
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
              Статус
            </span>
            <select
              value={typeof filters.status === "number" ? String(filters.status) : ""}
              onChange={(e) => {
                const v = e.target.value;
                const next = v ? Number(v) : undefined;
                setFilters((f) => ({ ...f, status: next, page: 1 }));
              }}
              className="h-10 w-64 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
            >
              <option value="">Все</option>
              <option value={ClientStatusNumber.Active}>Активен</option>
              <option value={ClientStatusNumber.Archived}>Архивирован</option>
            </select>
          </div>
        </FilterBar>
      </div>

      {query.isLoading ? (
        <div className="mt-4">
          <LoadingListSkeleton rows={9} />
        </div>
      ) : clients.length === 0 ? (
        <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-5 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
          Ничего не найдено.
        </div>
      ) : (
        <div className="mt-4">
          <CardGrid
            items={clients}
            renderCard={(c) => {
              return (
                <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-base font-semibold text-zinc-900 dark:text-zinc-50">
                        {c.fullName}
                      </div>
                      <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                        {c.phone} • {c.email ?? "—"}
                      </div>
                      <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                        {c.address ?? "—"}
                      </div>
                    </div>
                    <StatusPill kind="client" value={c.status} />
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditWithValues(c)}
                      className="rounded-md border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900/40"
                    >
                      Редактировать
                    </button>
                    {canArchive ? (
                      <button
                        type="button"
                        onClick={() => {
                          setArchiveId(c.id);
                          setArchiveOpen(true);
                        }}
                        className="rounded-md border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 dark:border-rose-900/40 dark:text-rose-200 dark:hover:bg-rose-900/20"
                      >
                        Архивировать
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            }}
          />

          <div className="mt-4">
            {query.data ? (
              <Pagination
                page={query.data.page}
                pageSize={query.data.pageSize}
                totalCount={query.data.totalCount}
                onPageChange={(next) =>
                  setFilters((f) => ({ ...f, page: next }))
                }
              />
            ) : null}
          </div>
        </div>
      )}

      <Modal
        open={createOpen}
        title="Добавить клиента"
        onClose={() => {
          setCreateOpen(false);
          setFormError(null);
        }}
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setCreateOpen(false);
                setFormError(null);
              }}
              className="rounded-md border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900/40"
              disabled={isSubmitting}
            >
              Отмена
            </button>
            <button
              type="submit"
              form="client-form"
              className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Сохранение..." : "Создать"}
            </button>
          </div>
        }
      >
        <form
          id="client-form"
          onSubmit={handleSubmit(async (values) => {
            await submitCreate(values);
          })}
          className="flex flex-col gap-4"
        >
          {formError ? <FormApiError error={formError} /> : null}
          <RHFTextInput<CreateClientValues>
            control={control}
            name="fullName"
            label="ФИО"
            placeholder="Иванов Иван"
          />
          <RHFTextInput<CreateClientValues>
            control={control}
            name="phone"
            label="Телефон"
            placeholder="+7..."
          />
          <RHFTextInput<CreateClientValues>
            control={control}
            name="email"
            label="Email (опционально)"
            placeholder="email@example.com"
          />
          <RHFTextInput<CreateClientValues>
            control={control}
            name="address"
            label="Адрес (опционально)"
            placeholder="Адрес"
          />
          <RHFTextArea<CreateClientValues>
            control={control}
            name="notes"
            label="Заметки (опционально)"
            placeholder="Заметки"
            rows={4}
          />
        </form>
      </Modal>

      <Modal
        open={editOpen}
        title="Редактировать клиента"
        onClose={() => {
          setEditOpen(false);
          setEditId(null);
          setFormError(null);
        }}
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setEditOpen(false);
                setEditId(null);
                setFormError(null);
              }}
              className="rounded-md border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900/40"
              disabled={isSubmitting}
            >
              Отмена
            </button>
            <button
              type="submit"
              form="client-edit-form"
              className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Сохранение..." : "Сохранить"}
            </button>
          </div>
        }
      >
        <form
          id="client-edit-form"
          onSubmit={handleSubmit(async (values) => {
            await submitEdit(values);
          })}
          className="flex flex-col gap-4"
        >
          {formError ? <FormApiError error={formError} /> : null}
          <RHFTextInput<CreateClientValues>
            control={control}
            name="fullName"
            label="ФИО"
          />
          <RHFTextInput<CreateClientValues>
            control={control}
            name="phone"
            label="Телефон"
          />
          <RHFTextInput<CreateClientValues>
            control={control}
            name="email"
            label="Email (опционально)"
          />
          <RHFTextInput<CreateClientValues>
            control={control}
            name="address"
            label="Адрес (опционально)"
          />
          <RHFTextArea<CreateClientValues>
            control={control}
            name="notes"
            label="Заметки (опционально)"
            rows={4}
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={archiveOpen}
        title="Архивировать клиента?"
        description={archiveId ? "После архивации запись пропадёт из активных списков." : undefined}
        confirmText="Архивировать"
        cancelText="Отмена"
        onClose={() => {
          setArchiveOpen(false);
          setArchiveId(null);
          setFormError(null);
        }}
        onConfirm={archiveClient}
      />
    </div>
  );
}


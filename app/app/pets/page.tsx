"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

import { apiClient } from "@/lib/api/client/apiClient";
import {
  GetClientsResponseSchema,
  GetPetsResponseSchema,
  dateOnlySchema,
  guidSchema,
  PetStatusNumber,
  ClientStatusNumber,
  PetResponseSchema,
} from "@/lib/api/schemas";
import type { NormalizedApiError } from "@/lib/api/errors";

import { RHFTextInput } from "@/components/forms/RHFTextInput";
import { RHFSelect } from "@/components/forms/RHFSelect";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CardGrid } from "@/components/ui/CardGrid";
import { FilterBar } from "@/components/ui/FilterBar";
import { Pagination } from "@/components/ui/Pagination";
import { StatusPill } from "@/components/ui/StatusPill";
import { LoadingListSkeleton } from "@/components/ui/LoadingSkeleton";
import { APIErrorBanner } from "@/components/ui/APIErrorBanner";
import { FormApiError } from "@/components/forms/FormApiError";

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

const petSchema = z.object({
  name: z.string().min(1),
  species: z.string().min(1),
  birthDate: z
    .union([dateOnlySchema, z.literal(""), z.null()])
    .transform((v) => (v === "" || v === null ? null : v)),
  clientId: z
    .union([guidSchema, z.literal(""), z.null()])
    .transform((v) => (v === "" || v === null ? null : v)),
});

const assignClientSchema = z.object({
  clientId: z
    .union([guidSchema, z.literal(""), z.null()])
    .transform((v) => (v === "" || v === null ? null : v)),
});

type PetFormValues = z.infer<typeof petSchema>;
type AssignClientValues = z.infer<typeof assignClientSchema>;

type ClientFilters = {
  search: string;
  status: number | undefined;
  clientId: string | null;
  page: number;
  pageSize: number;
};

export default function PetsPage() {
  const { data: session, status } = useSession();
  const role = typeof session?.role === "string" ? session.role : null;
  const router = useRouter();

  const queryClient = useQueryClient();

  const canCreate = role === "Admin" || role === "Receptionist";
  const canArchive = role === "Admin" || role === "Receptionist";

  const [searchDraft, setSearchDraft] = useState("");
  const [filters, setFilters] = useState<ClientFilters>({
    search: "",
    status: undefined,
    clientId: null,
    page: 1,
    pageSize: 20,
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiveId, setArchiveId] = useState<string | null>(null);

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignPetId, setAssignPetId] = useState<string | null>(null);
  const [formError, setFormError] = useState<NormalizedApiError | null>(null);


  const clientsQuery = useQuery({
    queryKey: ["clients_for_pets_dropdown"],
    enabled: status === "authenticated",
    queryFn: async () => {
      const res = await apiClient.get("/api/clients", {
        params: { page: 1, pageSize: 50, status: ClientStatusNumber.Active },
      });
      return GetClientsResponseSchema.parse(res.data);
    },
  });

  const petsQuery = useQuery({
    queryKey: ["pets", filters],
    enabled: status === "authenticated",
    queryFn: async () => {
      const params: {
        search?: string;
        page: number;
        pageSize: number;
        status?: number;
        clientId?: string;
      } = {
        page: filters.page,
        pageSize: filters.pageSize,
      };
      if (filters.search.trim().length > 0) params.search = filters.search.trim();
      if (typeof filters.status === "number") params.status = filters.status;
      if (filters.clientId) params.clientId = filters.clientId;

      const res = await apiClient.get("/api/pets", { params });
      return GetPetsResponseSchema.parse(res.data);
    },
  });

  const petClients = clientsQuery.data?.items ?? [];

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<PetFormValues>({
    resolver: zodResolver(petSchema),
    defaultValues: {
      name: "",
      species: "",
      birthDate: null,
      clientId: null,
    },
  });

  const assignForm = useForm<AssignClientValues>({
    resolver: zodResolver(assignClientSchema),
    defaultValues: { clientId: null },
    mode: "onSubmit",
  });

  const onApplyFilters = () => {
    setFilters((f) => ({ ...f, search: searchDraft, page: 1 }));
  };

  const onResetFilters = () => {
    setSearchDraft("");
    setFilters({ search: "", status: undefined, clientId: null, page: 1, pageSize: 20 });
  };

  const openCreate = () => {
    setFormError(null);
    setEditId(null);
    reset({ name: "", species: "", birthDate: null, clientId: null });
    setCreateOpen(true);
  };

  const openEdit = (pet: z.infer<typeof PetResponseSchema>) => {
    setFormError(null);
    setEditId(pet.id);
    reset({
      name: pet.name,
      species: pet.species,
      birthDate: pet.birthDate,
      clientId: pet.clientId,
    });
    setEditOpen(true);
  };

  const submitCreate = async (values: PetFormValues) => {
    setFormError(null);
    try {
      await apiClient.post("/api/pets", {
        name: values.name,
        species: values.species,
        birthDate: values.birthDate,
        clientId: values.clientId,
      });
      setCreateOpen(false);
      reset({ name: "", species: "", birthDate: null, clientId: null });
      await queryClient.invalidateQueries({ queryKey: ["pets"] });
    } catch (e: unknown) {
      if (isNormalizedApiError(e)) setFormError(e);
    }
  };

  const submitEdit = async (values: PetFormValues) => {
    if (!editId) return;
    setFormError(null);
    try {
      await apiClient.put(`/api/pets/${editId}`, {
        name: values.name,
        species: values.species,
        birthDate: values.birthDate,
      });
      setEditOpen(false);
      setEditId(null);
      reset({ name: "", species: "", birthDate: null, clientId: null });
      await queryClient.invalidateQueries({ queryKey: ["pets"] });
    } catch (e: unknown) {
      if (isNormalizedApiError(e)) setFormError(e);
    }
  };

  const archivePet = async () => {
    if (!archiveId) return;
    setFormError(null);
    try {
      await apiClient.post(`/api/pets/${archiveId}/archive`);
      setArchiveOpen(false);
      setArchiveId(null);
      await queryClient.invalidateQueries({ queryKey: ["pets"] });
    } catch (e: unknown) {
      if (isNormalizedApiError(e)) setFormError(e);
      setArchiveOpen(false);
      setArchiveId(null);
    }
  };

  const openAssign = (petId: string, currentClientId: string | null) => {
    setFormError(null);
    setAssignPetId(petId);
    assignForm.reset({ clientId: currentClientId });
    setAssignOpen(true);
  };

  const submitAssign = async (values: AssignClientValues) => {
    if (!assignPetId) return;
    setFormError(null);
    try {
      await apiClient.put(`/api/pets/${assignPetId}/client`, {
        clientId: values.clientId,
      });
      setAssignOpen(false);
      setAssignPetId(null);
      await queryClient.invalidateQueries({ queryKey: ["pets"] });
    } catch (e: unknown) {
      if (isNormalizedApiError(e)) setFormError(e);
    }
  };

  if (status !== "authenticated") {
    return (
      <div className="mx-auto max-w-5xl">
        <LoadingListSkeleton rows={6} />
      </div>
    );
  }

  if (petsQuery.error && isNormalizedApiError(petsQuery.error)) {
    return (
      <div className="mx-auto max-w-5xl">
        <APIErrorBanner error={petsQuery.error} />
      </div>
    );
  }

  const pets = petsQuery.data?.items ?? [];

  const isClientLoading = clientsQuery.isLoading;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Питомцы
          </div>
          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-200">
            Поиск, фильтры и управление карточками.
          </div>
        </div>
        {canCreate ? (
          <button
            type="button"
            onClick={openCreate}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            Добавить питомца
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
              placeholder="Кличка, вид..."
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
              <option value={PetStatusNumber.Active}>Активен</option>
              <option value={PetStatusNumber.Archived}>Архивирован</option>
              <option value={PetStatusNumber.Deceased}>Павший</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
              Клиент
            </span>
            <select
              value={filters.clientId ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                setFilters((f) => ({ ...f, clientId: v ? v : null, page: 1 }));
              }}
              className="h-10 w-64 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
              disabled={isClientLoading}
            >
              <option value="">Все клиенты</option>
              {petsQuery.data
                ? null
                : null}
              {petClients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName}
                </option>
              ))}
            </select>
          </div>
        </FilterBar>
      </div>

      {petsQuery.isLoading ? (
        <div className="mt-4">
          <LoadingListSkeleton rows={9} />
        </div>
      ) : pets.length === 0 ? (
        <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-5 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
          Ничего не найдено.
        </div>
      ) : (
        <div className="mt-4">
          <CardGrid
            items={pets}
            renderCard={(p) => (
              <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-base font-semibold text-zinc-900 dark:text-zinc-50">
                      {p.name} • {p.species}
                    </div>
                    <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                      Дата рождения: {p.birthDate ?? "—"}
                    </div>
                    <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                      Клиент: {p.clientId ?? "—"}
                    </div>
                  </div>
                  <StatusPill kind="pet" value={p.status} />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(p)}
                    className="rounded-md border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900/40"
                  >
                    Редактировать
                  </button>

                  <button
                    type="button"
                    onClick={() => openAssign(p.id, p.clientId)}
                    className="rounded-md border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900/40"
                  >
                    Назначить клиента
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push(`/app/medical-records?petId=${p.id}`)}
                    className="rounded-md border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900/40"
                  >
                    Медкарты
                  </button>

                  {canArchive ? (
                    <button
                      type="button"
                      onClick={() => {
                        setArchiveId(p.id);
                        setArchiveOpen(true);
                      }}
                      className="rounded-md border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 dark:border-rose-900/40 dark:text-rose-200 dark:hover:bg-rose-900/20"
                    >
                      Архивировать
                    </button>
                  ) : null}
                </div>
              </div>
            )}
          />

          <div className="mt-4">
            {petsQuery.data ? (
              <Pagination
                page={petsQuery.data.page}
                pageSize={petsQuery.data.pageSize}
                totalCount={petsQuery.data.totalCount}
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
        title="Добавить питомца"
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
              form="pet-form"
              className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Сохранение..." : "Создать"}
            </button>
          </div>
        }
      >
        <form
          id="pet-form"
          onSubmit={handleSubmit(async (values) => submitCreate(values))}
          className="flex flex-col gap-4"
        >
          {formError ? <FormApiError error={formError} /> : null}
          <RHFTextInput
            control={control}
            name="name"
            label="Кличка"
            placeholder="Кличка"
          />
          <RHFTextInput
            control={control}
            name="species"
            label="Вид"
            placeholder="Вид"
          />
          <RHFTextInput
            control={control}
            name="birthDate"
            label="Дата рождения (опционально)"
            placeholder=""
            inputProps={{ type: "date" }}
          />

          <RHFTextInput
            control={control}
            name="clientId"
            label="clientId (опционально)"
            placeholder="UUID клиента"
          />
        </form>
      </Modal>

      <Modal
        open={editOpen}
        title="Редактировать питомца"
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
              form="pet-edit-form"
              className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Сохранение..." : "Сохранить"}
            </button>
          </div>
        }
      >
        <form
          id="pet-edit-form"
          onSubmit={handleSubmit(async (values) => submitEdit(values))}
          className="flex flex-col gap-4"
        >
          {formError ? <FormApiError error={formError} /> : null}
          <RHFTextInput
            control={control}
            name="name"
            label="Кличка"
            placeholder="Кличка"
          />
          <RHFTextInput
            control={control}
            name="species"
            label="Вид"
            placeholder="Вид"
          />
          <RHFTextInput
            control={control}
            name="birthDate"
            label="Дата рождения (опционально)"
            placeholder=""
            inputProps={{ type: "date" }}
          />
        </form>
      </Modal>

      <Modal
        open={assignOpen}
        title="Назначить клиента"
        onClose={() => {
          setAssignOpen(false);
          setAssignPetId(null);
          setFormError(null);
        }}
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setAssignOpen(false);
                setAssignPetId(null);
                setFormError(null);
              }}
              className="rounded-md border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900/40"
              disabled={false}
            >
              Отмена
            </button>
            <button
              type="submit"
              form="assign-form"
              className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              Сохранить
            </button>
          </div>
        }
      >
        <form
          id="assign-form"
          onSubmit={assignForm.handleSubmit(async (values) => submitAssign(values))}
          className="flex flex-col gap-4"
        >
          {formError ? <FormApiError error={formError} /> : null}
          <RHFSelect
            control={assignForm.control}
            name="clientId"
            label="Клиент"
            options={[
              { value: "", label: "Без клиента" },
              ...petClients.map((c) => ({ value: c.id, label: c.fullName })),
            ]}
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={archiveOpen}
        title="Архивировать питомца?"
        description={archiveId ? "После архивации запись пропадёт из активных списков." : undefined}
        confirmText="Архивировать"
        cancelText="Отмена"
        onClose={() => {
          setArchiveOpen(false);
          setArchiveId(null);
          setFormError(null);
        }}
        onConfirm={archivePet}
      />
    </div>
  );
}


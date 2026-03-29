"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { apiClient } from "@/lib/api/client/apiClient";
import {
  MedicalRecordResponseSchema,
  PetResponseSchema,
  dateOnlySchema,
  guidSchema,
} from "@/lib/api/schemas";
import type { NormalizedApiError } from "@/lib/api/errors";

import { APIErrorBanner } from "@/components/ui/APIErrorBanner";
import { LoadingListSkeleton } from "@/components/ui/LoadingSkeleton";
import { Modal } from "@/components/ui/Modal";
import { FormApiError } from "@/components/forms/FormApiError";
import { RHFTextInput } from "@/components/forms/RHFTextInput";
import { RHFTextArea } from "@/components/forms/RHFTextArea";

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

function nullableStringFromInput(value: string | null | undefined) {
  if (value === null || value === undefined) return null;
  const v = value.trim();
  return v.length === 0 ? null : v;
}

const editMedicalRecordSchema = z.object({
  complaint: z.string().min(1),
  diagnosis: z.string().min(1),
  treatmentPlan: z.string().min(1),
  prescription: z.string().min(1),
  attachments: z
    .union([z.string(), z.null()])
    .transform((v) => nullableStringFromInput(v)),
});

const addVaccinationSchema = z.object({
  vaccineName: z.string().min(1),
  vaccinationDate: dateOnlySchema,
  nextDueDate: z.union([dateOnlySchema, z.literal("")]),
  batch: z.string(),
  manufacturer: z.string(),
});

type EditMedicalRecordValues = z.infer<typeof editMedicalRecordSchema>;
type AddVaccinationValues = z.infer<typeof addVaccinationSchema>;

export default function MedicalRecordsPage() {
  const { data: session, status } = useSession();
  const role = typeof session?.role === "string" ? session.role : null;
  const canCreateMedicalRecord = role === "Veterinarian";
  const canAddVaccination = role === "Admin" || role === "Veterinarian";
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();

  const petId = searchParams.get("petId");
  const petIdValid = petId && guidSchema.safeParse(petId).success ? petId : null;

  const [editOpen, setEditOpen] = useState(false);
  const [editRecordId, setEditRecordId] = useState<string | null>(null);
  const [editError, setEditError] = useState<NormalizedApiError | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createError, setCreateError] = useState<NormalizedApiError | null>(null);

  const [vaccOpen, setVaccOpen] = useState(false);
  const [vaccRecordId, setVaccRecordId] = useState<string | null>(null);
  const [vaccError, setVaccError] = useState<NormalizedApiError | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["medical-records", petIdValid],
    enabled: status === "authenticated" && !!petIdValid,
    queryFn: async () => {
      const res = await apiClient.get(`/api/pets/${petIdValid}/medical-records`);
      const parsed = MedicalRecordResponseSchema.array().parse(res.data);
      return parsed;
    },
  });
  const petQuery = useQuery({
    queryKey: ["pet", petIdValid],
    enabled: status === "authenticated" && !!petIdValid,
    queryFn: async () => {
      const res = await apiClient.get(`/api/pets/${petIdValid}`);
      return PetResponseSchema.parse(res.data);
    },
  });

  const records = data ?? [];

  const normalizedQueryError = isNormalizedApiError(error) ? error : null;

  const editForm = useForm<EditMedicalRecordValues>({
    resolver: zodResolver(editMedicalRecordSchema),
    defaultValues: {
      complaint: "",
      diagnosis: "",
      treatmentPlan: "",
      prescription: "",
      attachments: null,
    },
  });

  const vaccForm = useForm<AddVaccinationValues>({
    resolver: zodResolver(addVaccinationSchema),
    defaultValues: {
      vaccineName: "",
      vaccinationDate: "",
      nextDueDate: "",
      batch: "",
      manufacturer: "",
    },
  });
  const createForm = useForm<EditMedicalRecordValues>({
    resolver: zodResolver(editMedicalRecordSchema),
    defaultValues: {
      complaint: "",
      diagnosis: "",
      treatmentPlan: "",
      prescription: "",
      attachments: null,
    },
  });

  const submitEdit = async (values: EditMedicalRecordValues) => {
    if (!editRecordId) return;
    setEditError(null);
    try {
      await apiClient.put(`/api/medical-records/${editRecordId}`, {
        complaint: values.complaint,
        diagnosis: values.diagnosis,
        treatmentPlan: values.treatmentPlan,
        prescription: values.prescription,
        attachments: values.attachments,
      });
      setEditOpen(false);
      setEditRecordId(null);
      await queryClient.invalidateQueries({ queryKey: ["medical-records"] });
    } catch (e: unknown) {
      if (isNormalizedApiError(e)) setEditError(e);
    }
  };

  const submitAddVaccination = async (values: AddVaccinationValues) => {
    if (!canAddVaccination || !vaccRecordId) return;
    setVaccError(null);
    try {
      await apiClient.post(
        `/api/medical-records/${vaccRecordId}/vaccinations`,
        {
          vaccineName: values.vaccineName,
          vaccinationDate: values.vaccinationDate,
          nextDueDate: values.nextDueDate === "" ? null : values.nextDueDate,
          batch: values.batch.trim().length === 0 ? null : values.batch,
          manufacturer:
            values.manufacturer.trim().length === 0
              ? null
              : values.manufacturer,
        },
      );
      setVaccOpen(false);
      setVaccRecordId(null);
      await queryClient.invalidateQueries({ queryKey: ["medical-records"] });
    } catch (e: unknown) {
      if (isNormalizedApiError(e)) setVaccError(e);
    }
  };
  const submitCreate = async (values: EditMedicalRecordValues) => {
    if (!petIdValid) return;
    setCreateError(null);
    try {
      await apiClient.post(`/api/pets/${petIdValid}/medical-records`, {
        complaint: values.complaint,
        diagnosis: values.diagnosis,
        treatmentPlan: values.treatmentPlan,
        prescription: values.prescription,
        attachments: values.attachments,
      });
      setCreateOpen(false);
      createForm.reset({
        complaint: "",
        diagnosis: "",
        treatmentPlan: "",
        prescription: "",
        attachments: null,
      });
      await queryClient.invalidateQueries({ queryKey: ["medical-records"] });
    } catch (e: unknown) {
      if (isNormalizedApiError(e)) setCreateError(e);
    }
  };

  const openEdit = (r: z.infer<typeof MedicalRecordResponseSchema>) => {
    setEditRecordId(r.id);
    setEditError(null);
    editForm.reset({
      complaint: r.complaint,
      diagnosis: r.diagnosis,
      treatmentPlan: r.treatmentPlan,
      prescription: r.prescription,
      attachments: r.attachments,
    });
    setEditOpen(true);
  };

  const openVacc = (recordId: string) => {
    if (!canAddVaccination) return;
    setVaccRecordId(recordId);
    setVaccError(null);
    vaccForm.reset({
      vaccineName: "",
      vaccinationDate: "",
      nextDueDate: "",
      batch: "",
      manufacturer: "",
    });
    setVaccOpen(true);
  };

  const headerTitle = petIdValid ? `Медицинские записи` : "Медицинские записи";

  if (!petIdValid) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          {headerTitle}
        </div>
        <div className="mt-3 rounded-lg border border-zinc-200 bg-white p-5 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
          Не выбран `petId`. Откройте медкарты из карточки питомца.
        </div>
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="mx-auto max-w-5xl">
        <LoadingListSkeleton rows={6} />
      </div>
    );
  }

  if (normalizedQueryError) {
    return (
      <div className="mx-auto max-w-5xl">
        <APIErrorBanner error={normalizedQueryError} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-end justify-between gap-3">
        <div className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Медицинские записи
        </div>
        {canCreateMedicalRecord ? (
          <button
            type="button"
            onClick={() => {
              createForm.reset({
                complaint: "",
                diagnosis: "",
                treatmentPlan: "",
                prescription: "",
                attachments: null,
              });
              setCreateError(null);
              setCreateOpen(true);
            }}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            Создать медкарту
          </button>
        ) : null}
      </div>
      <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-200">
        petId: {petIdValid}
      </div>
      <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-200">
        Питомец: {petQuery.data ? `${petQuery.data.name} (${petQuery.data.species})` : "—"}
      </div>

      {isLoading ? (
        <div className="mt-4">
          <LoadingListSkeleton rows={5} />
        </div>
      ) : records.length === 0 ? (
        <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-5 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
          Записей пока нет.
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {records.map((r) => (
            <div
              key={r.id}
              className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {r.createdAt}
                  </div>
                  <div className="mt-2 text-sm text-zinc-700 dark:text-zinc-200">
                    <div className="font-semibold">Жалобы</div>
                    <div className="line-clamp-2">{r.complaint}</div>
                  </div>
                  <div className="mt-2 text-sm text-zinc-700 dark:text-zinc-200">
                    <div className="font-semibold">Диагноз</div>
                    <div className="line-clamp-2">{r.diagnosis}</div>
                  </div>
                  <div className="mt-2 text-sm text-zinc-700 dark:text-zinc-200">
                    <div className="font-semibold">Лечение</div>
                    <div className="line-clamp-2">{r.treatmentPlan}</div>
                  </div>
                  {r.attachments ? (
                    <div className="mt-2 text-sm text-zinc-700 dark:text-zinc-200">
                      <span className="font-semibold">Вложения:</span> {r.attachments}
                    </div>
                  ) : null}

                  <div className="mt-3">
                    <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      Вакцинации
                    </div>
                    <div className="mt-2 flex flex-col gap-2">
                      {r.vaccinations.map((v) => (
                        <div
                          key={v.id}
                          className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-200"
                        >
                          <div className="font-semibold">{v.vaccineName}</div>
                          <div className="mt-1 text-xs opacity-80">
                            Дата: {v.vaccinationDate} • Следующая:{" "}
                            {v.nextDueDate ?? "—"}
                          </div>
                          <div className="mt-1 text-xs opacity-80">
                            Партия: {v.batch ?? "—"} • Производитель:{" "}
                            {v.manufacturer ?? "—"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(r)}
                    className="rounded-md border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900/40"
                  >
                    Редактировать
                  </button>
                  {canAddVaccination ? (
                    <button
                      type="button"
                      onClick={() => openVacc(r.id)}
                      className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
                    >
                      Добавить вакцинацию
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={createOpen}
        title="Создать медкарту"
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
              form="create-medical-record"
              className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              Создать
            </button>
          </div>
        }
      >
        <form
          id="create-medical-record"
          onSubmit={createForm.handleSubmit(async (values) => submitCreate(values))}
          className="flex flex-col gap-4"
        >
          {createError ? <FormApiError error={createError} /> : null}
          <RHFTextArea control={createForm.control} name="complaint" label="Жалобы" rows={3} />
          <RHFTextArea control={createForm.control} name="diagnosis" label="Диагноз" rows={3} />
          <RHFTextArea
            control={createForm.control}
            name="treatmentPlan"
            label="План лечения"
            rows={3}
          />
          <RHFTextArea
            control={createForm.control}
            name="prescription"
            label="Назначения"
            rows={3}
          />
          <RHFTextInput
            control={createForm.control}
            name="attachments"
            label="attachments (опционально)"
            placeholder="Строка/URL"
          />
        </form>
      </Modal>

      <Modal
        open={editOpen}
        title="Редактировать медзапись"
        onClose={() => {
          setEditOpen(false);
          setEditRecordId(null);
          setEditError(null);
        }}
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setEditOpen(false);
                setEditRecordId(null);
                setEditError(null);
              }}
              className="rounded-md border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900/40"
            >
              Отмена
            </button>
            <button
              type="submit"
              form="edit-medical-record"
              className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              Сохранить
            </button>
          </div>
        }
      >
        <form
          id="edit-medical-record"
          onSubmit={editForm.handleSubmit(async (values) => submitEdit(values))}
          className="flex flex-col gap-4"
        >
          {editError ? <FormApiError error={editError} /> : null}
          <RHFTextArea
            control={editForm.control}
            name="complaint"
            label="Жалобы"
            rows={3}
          />
          <RHFTextArea
            control={editForm.control}
            name="diagnosis"
            label="Диагноз"
            rows={3}
          />
          <RHFTextArea
            control={editForm.control}
            name="treatmentPlan"
            label="План лечения"
            rows={3}
          />
          <RHFTextArea
            control={editForm.control}
            name="prescription"
            label="Назначения"
            rows={3}
          />
          <RHFTextInput
            control={editForm.control}
            name="attachments"
            label="attachments (опционально)"
            placeholder="Строка/URL"
          />
        </form>
      </Modal>

      <Modal
        open={vaccOpen}
        title="Добавить вакцинацию"
        onClose={() => {
          setVaccOpen(false);
          setVaccRecordId(null);
          setVaccError(null);
        }}
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setVaccOpen(false);
                setVaccRecordId(null);
                setVaccError(null);
              }}
              className="rounded-md border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900/40"
            >
              Отмена
            </button>
            <button
              type="submit"
              form="add-vaccination-form"
              className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              Добавить
            </button>
          </div>
        }
      >
        <form
          id="add-vaccination-form"
          onSubmit={vaccForm.handleSubmit(async (values) =>
            submitAddVaccination(values),
          )}
          className="flex flex-col gap-4"
        >
          {vaccError ? <FormApiError error={vaccError} /> : null}
          <RHFTextInput
            control={vaccForm.control}
            name="vaccineName"
            label="Вакцина"
            placeholder="Название"
          />
          <RHFTextInput
            control={vaccForm.control}
            name="vaccinationDate"
            label="Дата вакцинации"
            inputProps={{ type: "date" }}
          />
          <RHFTextInput
            control={vaccForm.control}
            name="nextDueDate"
            label="Следующая дата (опционально)"
            inputProps={{ type: "date" }}
          />
          <RHFTextInput
            control={vaccForm.control}
            name="batch"
            label="Партия (опционально)"
            placeholder="batch"
          />
          <RHFTextInput
            control={vaccForm.control}
            name="manufacturer"
            label="Производитель (опционально)"
            placeholder="manufacturer"
          />
        </form>
      </Modal>
    </div>
  );
}


"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { apiClient } from "@/lib/api/client/apiClient";
import {
  GetUsersResponseSchema,
  userRoleNumberSchema,
  UserRoleNumber,
  UserStatusNumber,
} from "@/lib/api/schemas";
import type { NormalizedApiError } from "@/lib/api/errors";

import { DataTable } from "@/components/ui/DataTable";
import { FilterBar } from "@/components/ui/FilterBar";
import { Pagination } from "@/components/ui/Pagination";
import { LoadingListSkeleton } from "@/components/ui/LoadingSkeleton";
import { APIErrorBanner } from "@/components/ui/APIErrorBanner";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { RHFTextInput } from "@/components/forms/RHFTextInput";
import { RHFNumberSelect } from "@/components/forms/RHFNumberSelect";
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

const editUserSchema = z.object({
  fullName: z.string().optional(),
  role: userRoleNumberSchema,
});

type EditUserValues = z.infer<typeof editUserSchema>;

export default function AdminUsersPage() {
  const { status } = useSession();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [role, setRole] = useState<number | undefined>(undefined);
  const [userStatus, setUserStatus] = useState<number | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  const [editOpen, setEditOpen] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [editError, setEditError] = useState<NormalizedApiError | null>(null);

  const [disableOpen, setDisableOpen] = useState(false);
  const [disableUserId, setDisableUserId] = useState<string | null>(null);

  const { control, handleSubmit, reset } = useForm<EditUserValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: { fullName: "", role: UserRoleNumber.Admin },
  });

  const usersQuery = useQuery({
    queryKey: ["admin_users", { search, role, userStatus, page, pageSize }],
    enabled: status === "authenticated",
    queryFn: async () => {
      const params: {
        search?: string;
        role?: number;
        status?: number;
        page: number;
        pageSize: number;
      } = { page, pageSize };
      if (search.trim().length > 0) params.search = search.trim();
      if (typeof role === "number") params.role = role;
      if (typeof userStatus === "number") params.status = userStatus;

      const res = await apiClient.get("/api/users", { params });
      return GetUsersResponseSchema.parse(res.data);
    },
  });

  const normalizedError = isNormalizedApiError(usersQuery.error) ? usersQuery.error : null;

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin_users"] });
  };

  const onEdit = (user: z.infer<typeof GetUsersResponseSchema>["items"][number]) => {
    setEditUserId(user.id);
    setEditError(null);
    reset({
      fullName: user.fullName ?? "",
      role:
        user.role === "Admin"
          ? UserRoleNumber.Admin
          : user.role === "Veterinarian"
            ? UserRoleNumber.Veterinarian
            : UserRoleNumber.Receptionist,
    });
    setEditOpen(true);
  };

  const submitEdit = async (values: EditUserValues) => {
    if (!editUserId) return;
    setEditError(null);
    try {
      await apiClient.put(`/api/users/${editUserId}`, {
        fullName: values.fullName === "" ? undefined : values.fullName ?? undefined,
        role: values.role,
      });
      setEditOpen(false);
      setEditUserId(null);
      await invalidate();
    } catch (e: unknown) {
      if (isNormalizedApiError(e)) setEditError(e);
    }
  };

  const disableUser = async () => {
    if (!disableUserId) return;
    setDisableOpen(false);
    try {
      await apiClient.post(`/api/users/${disableUserId}/disable`);
      setDisableUserId(null);
      await invalidate();
    } catch (e: unknown) {
      if (isNormalizedApiError(e)) setEditError(e);
      setDisableUserId(null);
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

  const items = usersQuery.data?.items ?? [];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Пользователи
      </div>

      <div className="mt-4">
        <FilterBar
          onApply={() => setPage(1)}
          onReset={() => {
            setSearch("");
            setRole(undefined);
            setUserStatus(undefined);
            setPage(1);
          }}
        >
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
              Поиск
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-64 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
              placeholder="email"
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
              Роль
            </span>
            <select
              value={typeof role === "number" ? String(role) : ""}
              onChange={(e) => {
                const v = e.target.value;
                setRole(v ? Number(v) : undefined);
              }}
              className="h-10 w-64 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
            >
              <option value="">Все</option>
              <option value={UserRoleNumber.Admin}>Admin</option>
              <option value={UserRoleNumber.Veterinarian}>Veterinarian</option>
              <option value={UserRoleNumber.Receptionist}>Receptionist</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
              Статус
            </span>
            <select
              value={typeof userStatus === "number" ? String(userStatus) : ""}
              onChange={(e) => {
                const v = e.target.value;
                setUserStatus(v ? Number(v) : undefined);
              }}
              className="h-10 w-64 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
            >
              <option value="">Все</option>
              <option value={UserStatusNumber.Active}>Active</option>
              <option value={UserStatusNumber.Disabled}>Disabled</option>
            </select>
          </div>
        </FilterBar>
      </div>

      {usersQuery.isLoading ? (
        <div className="mt-4">
          <LoadingListSkeleton rows={8} />
        </div>
      ) : (
        <div className="mt-4">
          <DataTable
            rowKey={(row) => row.id}
            rows={items}
            columns={[
              { header: "Email", cell: (r) => r.email },
              { header: "Роль", cell: (r) => r.role },
              { header: "ФИО", cell: (r) => r.fullName ?? "—" },
              { header: "Статус", cell: (r) => r.status },
              {
                header: "Создан",
                cell: (r) => new Date(r.createdAt).toLocaleDateString(),
              },
              {
                header: "Действия",
                cell: (r) => (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(r)}
                      className="rounded-md border border-zinc-200 px-2 py-1 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900/40"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDisableUserId(r.id);
                        setDisableOpen(true);
                      }}
                      className="rounded-md border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 dark:border-rose-900/40 dark:text-rose-200 dark:hover:bg-rose-900/20"
                    >
                      Disable
                    </button>
                  </div>
                ),
              },
            ]}
          />

          {usersQuery.data ? (
            <Pagination
              page={usersQuery.data.page}
              pageSize={usersQuery.data.pageSize}
              totalCount={usersQuery.data.totalCount}
              onPageChange={(next) => setPage(next)}
            />
          ) : null}
        </div>
      )}

      <Modal
        open={editOpen}
        title="Редактировать пользователя"
        onClose={() => {
          setEditOpen(false);
          setEditUserId(null);
          setEditError(null);
        }}
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setEditOpen(false);
                setEditUserId(null);
                setEditError(null);
              }}
              className="rounded-md border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900/40"
            >
              Отмена
            </button>
            <button
              type="submit"
              form="edit-user-form"
              className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              Сохранить
            </button>
          </div>
        }
      >
        <form
          id="edit-user-form"
          onSubmit={handleSubmit(async (values) => submitEdit(values))}
          className="flex flex-col gap-4"
        >
          {editError ? <FormApiError error={editError} /> : null}
          <RHFTextInput<EditUserValues>
            control={control}
            name="fullName"
            label="ФИО (опционально)"
            placeholder="Полное имя"
          />
          <RHFNumberSelect<EditUserValues>
            control={control}
            name="role"
            label="Роль"
            options={[
              { value: UserRoleNumber.Admin, label: "Admin" },
              { value: UserRoleNumber.Veterinarian, label: "Veterinarian" },
              { value: UserRoleNumber.Receptionist, label: "Receptionist" },
            ]}
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={disableOpen}
        title="Отключить пользователя?"
        description="Пользователь будет отключён и не сможет входить."
        confirmText="Отключить"
        onClose={() => {
          setDisableOpen(false);
          setDisableUserId(null);
        }}
        cancelText="Отмена"
        onConfirm={disableUser}
      />
    </div>
  );
}


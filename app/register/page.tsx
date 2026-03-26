"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { userRoleNumberSchema } from "@/lib/api/schemas";
import { normalizeApiError } from "@/lib/api/errors";
import type { NormalizedApiError } from "@/lib/api/errors";
import { RHFTextInput } from "@/components/forms/RHFTextInput";
import { RHFNumberSelect } from "@/components/forms/RHFNumberSelect";
import { FormApiError } from "@/components/forms/FormApiError";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  role: userRoleNumberSchema,
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<NormalizedApiError | null>(null);

  const { control, handleSubmit } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      role: 1,
    },
    mode: "onSubmit",
  });

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5187";

  const onSubmit = async (values: RegisterFormValues) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
        cache: "no-store",
      });

      if (!res.ok) {
        const contentType = res.headers.get("content-type") ?? "";
        const data: unknown = contentType.includes("application/json")
          ? await res.json()
          : await res.text();

        setError(normalizeApiError(res.status, data));
        return;
      }

      const signInRes = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (!signInRes || signInRes.error) {
        setError({
          type: "login_after_register_failed",
          title: "Не удалось войти после регистрации. Попробуйте войти вручную.",
          status: 401,
          detail: null,
          traceId: null,
          isPlainText: false,
        });
        return;
      }

      router.push("/onboarding");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4 py-10">
      <div className="w-full rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="text-lg font-semibold">Регистрация</div>
        <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          Выберите роль и создайте аккаунт.
        </div>

        {error ? <FormApiError error={error} /> : null}

        <form className="mt-4 flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <RHFNumberSelect
            control={control}
            name="role"
            label="Роль"
            options={[
              { value: 1, label: "Ветврач" },
              { value: 2, label: "Ресепшн" },
            ]}
          />

          <RHFTextInput
            control={control}
            name="email"
            label="Email"
            placeholder="name@example.com"
            inputProps={{
              autoComplete: "email",
              inputMode: "email",
              type: "email",
            }}
          />

          <RHFTextInput
            control={control}
            name="password"
            label="Пароль"
            placeholder="минимум 1 символ"
            inputProps={{
              autoComplete: "new-password",
              type: "password",
            }}
          />

          <button
            type="submit"
            disabled={busy}
            className="mt-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            {busy ? "Создание..." : "Создать аккаунт"}
          </button>
        </form>
      </div>
    </div>
  );
}


"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { AuthLoginRequestSchema } from "@/lib/api/schemas";
import { RHFTextInput } from "@/components/forms/RHFTextInput";
import { FormApiError } from "@/components/forms/FormApiError";
import type { NormalizedApiError } from "@/lib/api/errors";

type LoginFormValues = z.infer<typeof AuthLoginRequestSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<NormalizedApiError | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(AuthLoginRequestSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onSubmit",
  });

  const onSubmit = async (values: LoginFormValues) => {
    setBusy(true);
    setError(null);
    try {
      const res = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (!res || res.error) {
        setError({
          type: "invalid_credentials",
          title: "Неверный email или пароль.",
          status: 401,
          detail: null,
          traceId: null,
          isPlainText: false,
        });
        return;
      }

      router.push("/app/appointments");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4 py-10">
      <div className="w-full rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="text-lg font-semibold">Вход</div>
        <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          Введите email и пароль.
        </div>

        {error ? <FormApiError error={error} /> : null}

        <form className="mt-4 flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <RHFTextInput<LoginFormValues>
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
          <RHFTextInput<LoginFormValues>
            control={control}
            name="password"
            label="Пароль"
            placeholder="••••••••"
            inputProps={{ autoComplete: "current-password", type: "password" }}
          />

          <button
            type="submit"
            disabled={busy || isSubmitting}
            className="mt-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            {busy ? "Вход..." : "Войти"}
          </button>
        </form>
      </div>
    </div>
  );
}


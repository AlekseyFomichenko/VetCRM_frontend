"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type Step = {
  title: string;
  description: string;
  bullets: string[];
};

const steps: Step[] = [
  {
    title: "Заведите клиентов",
    description: "Начните с базовой карточки клиента.",
    bullets: ["Добавьте ФИО и телефон", "При необходимости укажите email"],
  },
  {
    title: "Создайте питомца",
    description: "Привяжите питомца к клиенту и заполните данные.",
    bullets: ["Укажите вид и кличку", "Добавьте дату рождения, если она известна"],
  },
  {
    title: "Запишитесь на приём",
    description: "Выберите дату и создайте приём в календаре.",
    bullets: ["Укажите питомца и клиента", "При необходимости выберите ветврача"],
  },
  {
    title: "Завершите приём и получите медкарту",
    description: "После завершения приёма система создаст медкарту.",
    bullets: ["Заполните complaint/diagnosis/treatment plan", "При необходимости добавьте вакцинации"],
  },
];

const onboardingDoneKey = "vetcrm_onboarding_done";
const onboardingStepKey = "vetcrm_onboarding_step";

export default function OnboardingPage() {
  const router = useRouter();
  const { status } = useSession();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedDone = window.localStorage.getItem(onboardingDoneKey);
    if (storedDone === "true") {
      router.replace("/app/appointments");
      return;
    }

    const rawStep = window.localStorage.getItem(onboardingStepKey);
    const parsed = rawStep ? Number(rawStep) : 0;
    if (Number.isFinite(parsed) && parsed >= 0 && parsed < steps.length) {
      void Promise.resolve().then(() => setStep(parsed));
    }
  }, [router]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(onboardingStepKey, String(step));
  }, [step]);

  const current = steps[step] ?? steps[0];

  const finish = () => {
    window.localStorage.setItem(onboardingDoneKey, "true");
    window.localStorage.removeItem(onboardingStepKey);
    router.replace("/app/appointments");
  };

  const skip = () => {
    window.localStorage.setItem(onboardingDoneKey, "true");
    window.localStorage.removeItem(onboardingStepKey);
    router.replace("/app/appointments");
  };

  const canPrev = step > 0;
  const isLast = step === steps.length - 1;

  const progress = useMemo(() => {
    const pct = ((step + 1) / steps.length) * 100;
    return Math.round(pct);
  }, [step]);

  if (status === "loading") {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-2xl items-center justify-center px-4">
        Загрузка...
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center px-4 text-center">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="text-lg font-semibold">Нужна авторизация</div>
          <div className="mt-2 text-sm text-zinc-700 dark:text-zinc-200">
            Войдите, чтобы продолжить онбординг.
          </div>
          <button
            type="button"
            onClick={() => router.replace("/login")}
            className="mt-4 rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            Войти
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="text-xl font-semibold">Ход</div>
        <div className="mt-2 text-sm text-zinc-700 dark:text-zinc-200">
          {progress}% завершено
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-4">
          {steps.map((s, idx) => (
            <div
              key={s.title}
              className={`rounded-lg border px-3 py-2 text-sm ${
                idx === step
                  ? "border-zinc-900 bg-zinc-50 font-semibold dark:border-zinc-50 dark:bg-zinc-900"
                  : "border-zinc-200 bg-white text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
              }`}
            >
              {idx + 1}. {s.title}
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2 md:items-start">
          <div>
            <div className="text-lg font-semibold">{current.title}</div>
            <div className="mt-2 text-sm text-zinc-700 dark:text-zinc-200">
              {current.description}
            </div>
            <ul className="mt-3 list-disc pl-5 text-sm text-zinc-700 dark:text-zinc-200">
              {current.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-sm font-semibold">Иллюстрация</div>
            <div className="mt-2 text-sm text-zinc-700 dark:text-zinc-200">
              В MVP здесь будет визуальная подсказка по шагу.
            </div>
            <div className="mt-4 h-48 rounded-lg bg-white dark:bg-zinc-950" />
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:justify-between">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={skip}
              className="rounded-md border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900"
            >
              Пропустить
            </button>
            {canPrev ? (
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                className="rounded-md border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900"
              >
                Назад
              </button>
            ) : null}
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                if (isLast) finish();
                else setStep((s) => Math.min(steps.length - 1, s + 1));
              }}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              {isLast ? "Готово" : "Далее"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 dark:bg-black dark:text-zinc-50">
      <header className="flex items-center justify-between px-4 py-4">
        <div className="text-base font-semibold">VetCRM</div>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-900"
          >
            Войти
          </Link>
          <Link
            href="/register"
            className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            Регистрация
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-16">
        <section className="mt-10 grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <div className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
              CRM для ветеринарной клиники
            </div>
            <h1 className="mt-4 text-4xl font-semibold leading-tight">
              Записи, медкарты и напоминания о вакцинациях в одном месте
            </h1>
            <p className="mt-4 max-w-xl text-zinc-700 dark:text-zinc-200">
              Управляйте клиентами, питомцами, приемами и медицинскими данными. Админ
              получает отчёты и журнал отправок напоминаний.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/login"
                className="rounded-md bg-zinc-900 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
              >
                Войти в CRM
              </Link>
              <Link
                href="/register"
                className="rounded-md border border-zinc-200 px-5 py-3 text-center text-sm font-semibold text-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-900"
              >
                Начать регистрацию
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-sm font-semibold">Что вы получаете</div>
            <div className="mt-4 grid gap-3">
              <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="font-semibold">Календарь приёмов</div>
                <div className="mt-1 text-sm text-zinc-700 dark:text-zinc-200">
                  Быстро найти приём по дате и управлять статусами.
                </div>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="font-semibold">Медкарты</div>
                <div className="mt-1 text-sm text-zinc-700 dark:text-zinc-200">
                  Обновляйте записи и добавляйте вакцинации.
                </div>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="font-semibold">Напоминания о вакцинациях</div>
                <div className="mt-1 text-sm text-zinc-700 dark:text-zinc-200">
                  Журнал и отправки через доступные каналы (demo/email/sms).
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-14">
          <div className="text-2xl font-semibold">Как это работает</div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="text-sm font-semibold">1. Регистрация</div>
              <div className="mt-2 text-sm text-zinc-700 dark:text-zinc-200">
                Создайте аккаунт ветврача или ресепшн.
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="text-sm font-semibold">2. Клиенты и питомцы</div>
              <div className="mt-2 text-sm text-zinc-700 dark:text-zinc-200">
                Добавьте карточки и привяжите питомцев к клиентам.
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="text-sm font-semibold">3. Приём и медкарта</div>
              <div className="mt-2 text-sm text-zinc-700 dark:text-zinc-200">
                Завершите приём и ведите историю лечения.
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-16 border-t border-zinc-200 pt-6 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
          VetCRM. Демо CRM для ветеринарной клиники.
        </footer>
      </main>
    </div>
  );
}

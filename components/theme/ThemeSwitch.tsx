"use client";

import type { ChangeEvent } from "react";
import { useTheme } from "next-themes";

type ThemeChoice = "light" | "dark";

const choices: Array<{ value: ThemeChoice; label: string }> = [
  { value: "light", label: "Светлая" },
  { value: "dark", label: "Тёмная" },
];

export function ThemeSwitch() {
  const { theme, setTheme } = useTheme();

  const currentTheme: ThemeChoice = theme === "dark" ? "dark" : "light";

  const onChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value as ThemeChoice;
    setTheme(next);
  };

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-zinc-600 dark:text-zinc-300">Тема</span>
      <select
        aria-label="Выбор темы"
        className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
        value={currentTheme}
        onChange={onChange}
      >
        {choices.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>
    </label>
  );
}


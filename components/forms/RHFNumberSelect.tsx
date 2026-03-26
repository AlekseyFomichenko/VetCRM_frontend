"use client";

import type { ChangeEvent, SelectHTMLAttributes } from "react";
import type {
  Control,
  FieldPath,
  FieldValues,
} from "react-hook-form";
import { Controller } from "react-hook-form";

import { FormFieldError } from "@/components/forms/FormFieldError";

type RHFNumberSelectOption = { value: number; label: string; disabled?: boolean };

type RHFNumberSelectProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  options: RHFNumberSelectOption[];
  placeholder?: string;
  selectProps?: Omit<SelectHTMLAttributes<HTMLSelectElement>, "name" | "value" | "onChange">;
};

export function RHFNumberSelect<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  options,
  placeholder,
  selectProps,
}: Readonly<RHFNumberSelectProps<TFieldValues>>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const message = fieldState.error?.message;
        const value = typeof field.value === "number" ? field.value : 0;
        return (
          <div>
            <label className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {label}
            </label>
            <select
              {...selectProps}
              value={value}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                const next = Number(e.target.value);
                field.onChange(Number.isFinite(next) ? next : value);
              }}
              className={`mt-1 w-full rounded-md border px-3 py-2 text-sm shadow-sm outline-none transition-colors ${
                message
                  ? "border-rose-300 dark:border-rose-700"
                  : "border-zinc-200 dark:border-zinc-800"
              } bg-white dark:bg-zinc-950 focus:border-zinc-400 dark:focus:border-zinc-500`}
            >
              {placeholder ? (
                <option value={0} disabled>
                  {placeholder}
                </option>
              ) : null}
              {options.map((o) => (
                <option key={o.value} value={o.value} disabled={o.disabled}>
                  {o.label}
                </option>
              ))}
            </select>
            <FormFieldError message={typeof message === "string" ? message : undefined} />
          </div>
        );
      }}
    />
  );
}


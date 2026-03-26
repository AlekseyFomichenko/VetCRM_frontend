"use client";

import type { ChangeEvent, SelectHTMLAttributes } from "react";
import type {
  Control,
  FieldPath,
  FieldValues,
  RegisterOptions,
} from "react-hook-form";
import { Controller } from "react-hook-form";

import { FormFieldError } from "@/components/forms/FormFieldError";

type RHFSelectOption = { value: string; label: string; disabled?: boolean };

type RHFSelectProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  options: RHFSelectOption[];
  placeholder?: string;
  rules?: RegisterOptions<TFieldValues, FieldPath<TFieldValues>>;
  selectProps?: Omit<SelectHTMLAttributes<HTMLSelectElement>, "name" | "value" | "onChange">;
};

export function RHFSelect<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  options,
  placeholder,
  selectProps,
}: Readonly<RHFSelectProps<TFieldValues>>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const message = fieldState.error?.message;
        return (
          <div>
            <label className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {label}
            </label>
            <select
              {...selectProps}
              value={(field.value ?? "") as string}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                field.onChange(e.target.value)
              }
              className={`mt-1 w-full rounded-md border px-3 py-2 text-sm shadow-sm outline-none transition-colors ${
                message
                  ? "border-rose-300 dark:border-rose-700"
                  : "border-zinc-200 dark:border-zinc-800"
              } bg-white dark:bg-zinc-950 focus:border-zinc-400 dark:focus:border-zinc-500`}
            >
              {placeholder ? (
                <option value="" disabled>
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


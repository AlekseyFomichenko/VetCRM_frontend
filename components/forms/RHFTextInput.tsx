"use client";

import type { ChangeEvent, InputHTMLAttributes } from "react";
import type {
  Control,
  FieldPath,
  FieldValues,
  RegisterOptions,
} from "react-hook-form";
import { Controller } from "react-hook-form";

import { FormFieldError } from "@/components/forms/FormFieldError";

type RHFTextInputProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  placeholder?: string;
  rules?: RegisterOptions<TFieldValues, FieldPath<TFieldValues>>;
  inputProps?: Omit<InputHTMLAttributes<HTMLInputElement>, "name" | "value" | "onChange">;
};

export function RHFTextInput<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  inputProps,
}: Readonly<RHFTextInputProps<TFieldValues>>) {
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
            <input
              {...inputProps}
              value={(field.value ?? "") as string}
              placeholder={placeholder}
              onChange={(e: ChangeEvent<HTMLInputElement>) => field.onChange(e.target.value)}
              className={`mt-1 w-full rounded-md border px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition-colors ${
                message
                  ? "border-rose-300 dark:border-rose-700"
                  : "border-zinc-200 dark:border-zinc-800"
              } bg-white dark:bg-zinc-950 focus:border-zinc-400 dark:focus:border-zinc-500`}
            />
            <FormFieldError message={typeof message === "string" ? message : undefined} />
          </div>
        );
      }}
    />
  );
}


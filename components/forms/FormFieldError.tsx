"use client";

type FormFieldErrorProps = {
  message?: string;
};

export function FormFieldError({ message }: Readonly<FormFieldErrorProps>) {
  if (!message) return null;
  return (
    <div className="mt-1 text-xs font-medium text-rose-700 dark:text-rose-200">
      {message}
    </div>
  );
}


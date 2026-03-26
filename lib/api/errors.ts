import { DomainErrorJsonResponseSchema } from "@/lib/api/schemas";

export type NormalizedApiError = {
  type: string;
  title: string;
  status: number;
  detail: unknown | null;
  traceId: string | null;
  isPlainText: boolean;
};

export const plainTextErrorType = "bad_request_plain_text";

export function normalizeApiError(status: number, data: unknown): NormalizedApiError {
  if (typeof data === "string") {
    return {
      type: plainTextErrorType,
      title: data,
      status,
      detail: null,
      traceId: null,
      isPlainText: true,
    };
  }

  const parsed = DomainErrorJsonResponseSchema.safeParse(data);
  if (parsed.success) {
    return {
      type: parsed.data.type,
      title: parsed.data.title,
      status: parsed.data.status,
      detail: parsed.data.detail,
      traceId: parsed.data.traceId ?? null,
      isPlainText: false,
    };
  }

  return {
    type: "unknown_api_error",
    title: "Некорректный ответ сервера",
    status,
    detail: data ?? null,
    traceId: null,
    isPlainText: false,
  };
}


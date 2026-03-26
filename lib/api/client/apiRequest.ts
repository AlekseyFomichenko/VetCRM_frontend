"use client";

import type { AxiosRequestConfig } from "axios";
import type { ZodTypeAny } from "zod";

import { apiClient } from "@/lib/api/client/apiClient";

export async function apiRequest<TSchema extends ZodTypeAny>(
  schema: TSchema,
  config: AxiosRequestConfig,
): Promise<TSchema["_output"]> {
  const res = await apiClient.request(config);
  return schema.parse(res.data);
}


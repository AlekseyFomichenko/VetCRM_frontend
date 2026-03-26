"use client";

import axios, {
  type AxiosError,
  type AxiosRequestConfig,
} from "axios";
import { getSession } from "next-auth/react";
import { LoginResponseSchema } from "@/lib/api/schemas";
import { normalizeApiError } from "@/lib/api/errors";

type ApiRequestConfig = AxiosRequestConfig & {
  skipAuth?: boolean;
  _retry?: boolean;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5187";

const apiClient = axios.create({
  baseURL: apiBaseUrl,
  headers: { "Content-Type": "application/json" },
});

let refreshInFlight:
  | Promise<{ accessToken: string; role: string; expiresAt: string }>
  | null = null;

async function refreshAccessToken(): Promise<{
  accessToken: string;
  role: string;
  expiresAt: string;
}> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const res = await fetch("/api/auth/refresh", { method: "POST" });
    if (!res.ok) {
      throw new Error("Refresh failed");
    }

    const data: unknown = await res.json();
    const parsed = LoginResponseSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error("Invalid refresh response shape");
    }

    return {
      accessToken: parsed.data.accessToken,
      role: parsed.data.role,
      expiresAt: parsed.data.expiresAt,
    };
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

function applyAuthorization(config: ApiRequestConfig, accessToken: string) {
  const headers = config.headers as Record<string, string> | undefined;
  config.headers = {
    ...(headers ?? {}),
    Authorization: `Bearer ${accessToken}`,
  };
}

apiClient.interceptors.request.use(async (config) => {
  const cfg = config as ApiRequestConfig;
  if (cfg.skipAuth) return config;

  const session = await getSession();
  const accessToken = session?.accessToken;
  if (typeof accessToken === "string" && accessToken.length > 0) {
    applyAuthorization(cfg, accessToken);
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (err: AxiosError) => {
    const status = err.response?.status ?? 0;
    const data = err.response?.data;

    const cfg = err.config as ApiRequestConfig | undefined;
    if (status === 401 && cfg && !cfg._retry) {
      cfg._retry = true;
      cfg.skipAuth = true;

      try {
        const fresh = await refreshAccessToken();
        applyAuthorization(cfg, fresh.accessToken);
        return apiClient.request(cfg as AxiosRequestConfig);
      } catch {
        return Promise.reject(normalizeApiError(status, data));
      }
    }

    return Promise.reject(normalizeApiError(status, data));
  },
);

export { apiClient };


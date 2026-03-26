import { cookies } from "next/headers";
import { NextResponse } from "next/server";

type BackendRefreshResponse = {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  userId: string;
  email: string;
  role: string;
};

function readString(obj: unknown, key: string): string | null {
  if (typeof obj !== "object" || obj === null) return null;
  const val = (obj as Record<string, unknown>)[key];
  return typeof val === "string" ? val : null;
}

export async function POST() {
  const cookieName = "vetcrm_refresh_token";
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(cookieName)?.value;

  if (!refreshToken) {
    return NextResponse.json(
      { error: "no_refresh_token" },
      { status: 401 },
    );
  }

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5187";

  const res = await fetch(`${apiBaseUrl}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: "refresh_failed" },
      { status: 401 },
    );
  }

  const data: unknown = await res.json();
  const accessToken = readString(data, "accessToken");
  const newRefreshToken = readString(data, "refreshToken");
  const expiresAt = readString(data, "expiresAt");
  const userId = readString(data, "userId");
  const email = readString(data, "email");
  const role = readString(data, "role");

  if (
    accessToken === null ||
    newRefreshToken === null ||
    expiresAt === null ||
    userId === null ||
    email === null ||
    role === null
  ) {
    return NextResponse.json(
      { error: "invalid_backend_response" },
      { status: 502 },
    );
  }

  const secure = process.env.NODE_ENV === "production";
  const sameSite: "lax" | "strict" | "none" = "lax";
  const maxAgeSeconds = 7 * 24 * 60 * 60;

  cookieStore.set(cookieName, newRefreshToken, {
    httpOnly: true,
    secure,
    sameSite,
    path: "/",
    maxAge: maxAgeSeconds,
  });

  const response: BackendRefreshResponse = {
    accessToken,
    refreshToken: newRefreshToken,
    expiresAt,
    userId,
    email,
    role,
  };

  return NextResponse.json(response, { status: 200 });
}


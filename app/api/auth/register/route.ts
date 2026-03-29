import { NextResponse } from "next/server";
import { AuthRegisterRequestSchema } from "@/lib/api/schemas";

export async function POST(request: Request) {
  const body: unknown = await request.json();
  const parsed = AuthRegisterRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        type: "validation_error",
        title: "Невалидные данные регистрации",
        status: 400,
        detail: parsed.error.flatten(),
        traceId: null,
      },
      { status: 400 },
    );
  }

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5187";

  try {
    const res = await fetch(`${apiBaseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
      cache: "no-store",
    });

    const contentType = res.headers.get("content-type") ?? "";
    const payload: unknown = contentType.includes("application/json")
      ? await res.json()
      : await res.text();

    if (!res.ok) {
      if (typeof payload === "string") {
        return NextResponse.json(payload, { status: res.status });
      }

      return NextResponse.json(payload, { status: res.status });
    }

    return NextResponse.json(payload, { status: res.status });
  } catch {
    return NextResponse.json(
      {
        type: "backend_unreachable",
        title: "Сервер API недоступен",
        status: 503,
        detail: null,
        traceId: null,
      },
      { status: 503 },
    );
  }
}

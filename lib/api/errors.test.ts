import { describe, expect, it } from "vitest";

import { normalizeApiError } from "./errors";

describe("normalizeApiError", () => {
  it("normalizes plain text errors (appointments/date)", () => {
    const err = normalizeApiError(400, "Invalid date format. Use YYYY-MM-DD.");
    expect(err.status).toBe(400);
    expect(err.isPlainText).toBe(true);
    expect(err.title).toContain("Invalid date format");
  });

  it("normalizes JSON domain errors (ProblemDetails-like)", () => {
    const err = normalizeApiError(409, {
      type: "appointment_conflict",
      title: "Appointment conflict",
      status: 409,
      detail: "Overlaps with existing appointment",
      traceId: "trace-123",
    });

    expect(err.status).toBe(409);
    expect(err.type).toBe("appointment_conflict");
    expect(err.isPlainText).toBe(false);
    expect(err.traceId).toBe("trace-123");
  });

  it("falls back to unknown_api_error on unexpected payload", () => {
    const err = normalizeApiError(500, { foo: "bar" });
    expect(err.type).toBe("unknown_api_error");
    expect(err.status).toBe(500);
  });
});


import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getAuthorizedAdminUserMock = vi.fn();

vi.mock("@/lib/admin/auth", () => ({
  getAuthorizedAdminUser: (...args: unknown[]) =>
    getAuthorizedAdminUserMock(...args),
  getUnauthorizedHeaders: () => ({
    "WWW-Authenticate": 'Basic realm="Macarena Admin", charset="UTF-8"',
  }),
}));

import { middleware } from "./middleware";

function createRequest(pathname: string, headers?: HeadersInit) {
  return {
    nextUrl: { pathname },
    headers: new Headers(headers),
  };
}

describe("admin middleware", () => {
  beforeEach(() => {
    getAuthorizedAdminUserMock.mockReset();
  });

  it("allows non-admin routes without auth lookup", async () => {
    const request = createRequest("/");
    const response = await middleware(request as unknown as NextRequest);

    expect(response.status).toBe(200);
    expect(getAuthorizedAdminUserMock).not.toHaveBeenCalled();
  });

  it("rejects protected routes when auth fails", async () => {
    getAuthorizedAdminUserMock.mockResolvedValue(null);

    const request = createRequest("/api/admin/orders");
    const response = await middleware(request as unknown as NextRequest);

    expect(getAuthorizedAdminUserMock).toHaveBeenCalledWith(null);
    expect(response.status).toBe(401);
    expect(response.headers.get("WWW-Authenticate")).toContain("Basic realm");
  });

  it("allows protected routes with valid auth and injects admin header", async () => {
    getAuthorizedAdminUserMock.mockResolvedValue("admin@example.com");

    const request = createRequest("/admin", {
      authorization: "Basic YWRtaW5AZXhhbXBsZS5jb206c2VjcmV0",
    });
    const response = await middleware(request as unknown as NextRequest);

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-override-headers")).toContain(
      "x-admin-user",
    );
  });
});

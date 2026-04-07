import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { middleware } from "./src/middleware";

function createRequest(pathname: string, headers?: HeadersInit) {
  const url = new URL(`http://localhost${pathname}`);
  return {
    nextUrl: {
      pathname,
      clone: () => new URL(url.toString()),
    },
    headers: new Headers(headers),
  };
}

describe("admin middleware", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("allows non-admin routes", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const request = createRequest("/");

    const response = await middleware(request as unknown as NextRequest);

    expect(response.status).toBe(200);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("rejects protected routes when auth header is missing", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const request = createRequest("/admin");

    const response = await middleware(request as unknown as NextRequest);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain(
      "/admin/login?next=%2Fadmin",
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("rejects protected routes when auth header is malformed", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const request = createRequest("/api/admin/orders", {
      authorization: "Bearer token",
    });

    const response = await middleware(request as unknown as NextRequest);

    expect(response.status).toBe(401);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("passes api route when auth header exists and verification succeeds", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("ok", { status: 200 }));

    const request = createRequest("/api/admin/orders", {
      authorization: "Basic YWRtaW5AZXhhbXBsZS5jb206c2VjcmV0",
    });

    const response = await middleware(request as unknown as NextRequest);

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [calledUrl, calledOptions] = fetchSpy.mock.calls[0] ?? [];
    expect(String(calledUrl)).toBe("http://localhost/api/admin/auth/verify");
    expect(calledOptions).toEqual(
      expect.objectContaining({
        method: "GET",
        cache: "no-store",
      }),
    );
  });

  it("redirects admin page to login when only basic auth is present", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const request = createRequest("/admin/pedidos", {
      authorization: "Basic YWRtaW5AZXhhbXBsZS5jb206c2VjcmV0",
    });

    const response = await middleware(request as unknown as NextRequest);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain(
      "/admin/login?next=%2Fadmin%2Fpedidos",
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("rejects when verification endpoint returns non-200", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("Unauthorized", { status: 401 }),
    );

    const request = createRequest("/api/admin/stats", {
      authorization: "Basic YWRtaW5AZXhhbXBsZS5jb206d3Jvbmc=",
    });

    const response = await middleware(request as unknown as NextRequest);

    expect(response.status).toBe(401);
  });

  it("bypasses verification route to avoid middleware recursion", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const request = createRequest("/api/admin/auth/verify", {
      authorization: "Basic YWJjOmRlZg==",
    });

    const response = await middleware(request as unknown as NextRequest);

    expect(response.status).toBe(200);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("allows admin login page without auth", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const request = createRequest("/admin/login");

    const response = await middleware(request as unknown as NextRequest);

    expect(response.status).toBe(200);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("allows login/logout auth APIs without auth", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const loginRequest = createRequest("/api/admin/auth/login");
    const logoutRequest = createRequest("/api/admin/auth/logout");

    const loginResponse = await middleware(
      loginRequest as unknown as NextRequest,
    );
    const logoutResponse = await middleware(
      logoutRequest as unknown as NextRequest,
    );

    expect(loginResponse.status).toBe(200);
    expect(logoutResponse.status).toBe(200);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("verifies session cookie when basic auth is missing", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("ok", { status: 200 }));

    const request = createRequest("/admin/sabores", {
      cookie: "macarena_admin_session=token123",
    });

    const response = await middleware(request as unknown as NextRequest);

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});

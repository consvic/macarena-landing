import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearRateLimitStore } from "./src/lib/rate-limit";
import { middleware } from "./src/middleware";

function createRequest(
  pathname: string,
  headers?: HeadersInit,
  method = "GET",
) {
  const url = new URL(`http://localhost${pathname}`);
  return {
    nextUrl: {
      pathname: url.pathname,
      search: url.search,
      clone: () => new URL(url.toString()),
    },
    headers: new Headers(headers),
    method,
  };
}

describe("admin middleware", () => {
  beforeEach(() => {
    clearRateLimitStore();
    vi.restoreAllMocks();
  });

  it("allows non-admin routes", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const request = createRequest("/");

    const response = await middleware(request as unknown as NextRequest);

    expect(response.status).toBe(200);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("allows public api routes while under the rate limit", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const request = createRequest("/api/flavors", {
      "x-forwarded-for": "203.0.113.10",
    });

    const response = await middleware(request as unknown as NextRequest);

    expect(response.status).toBe(200);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("applies the public read rate limit to flavor detail routes", async () => {
    const headers = { "x-forwarded-for": "203.0.113.16" };

    for (let index = 0; index < 120; index += 1) {
      const response = await middleware(
        createRequest(
          "/api/flavors/507f1f77bcf86cd799439011",
          headers,
        ) as unknown as NextRequest,
      );

      expect(response.status).toBe(200);
    }

    const response = await middleware(
      createRequest(
        "/api/flavors/507f1f77bcf86cd799439011",
        headers,
      ) as unknown as NextRequest,
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("X-RateLimit-Limit")).toBe("120");
  });

  it("returns 429 with rate limit headers after the public api limit is exceeded", async () => {
    const headers = { "x-forwarded-for": "203.0.113.11" };

    for (let index = 0; index < 5; index += 1) {
      const response = await middleware(
        createRequest(
          "/api/admin/auth/login",
          headers,
          "POST",
        ) as unknown as NextRequest,
      );
      expect(response.status).toBe(200);
    }

    const response = await middleware(
      createRequest(
        "/api/admin/auth/login",
        headers,
        "POST",
      ) as unknown as NextRequest,
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("900");
    expect(response.headers.get("X-RateLimit-Limit")).toBe("5");
    expect(response.headers.get("X-RateLimit-Remaining")).toBe("0");
    expect(response.headers.get("X-RateLimit-Reset")).toMatch(/^\d+$/);
    await expect(response.json()).resolves.toEqual({
      message: "Too many requests",
    });
  });

  it("tracks public api limits independently for different client ips", async () => {
    for (let index = 0; index < 5; index += 1) {
      await middleware(
        createRequest(
          "/api/admin/auth/login",
          { "x-forwarded-for": "203.0.113.12" },
          "POST",
        ) as unknown as NextRequest,
      );
    }

    const limitedResponse = await middleware(
      createRequest(
        "/api/admin/auth/login",
        { "x-forwarded-for": "203.0.113.12" },
        "POST",
      ) as unknown as NextRequest,
    );
    const otherIpResponse = await middleware(
      createRequest(
        "/api/admin/auth/login",
        { "x-forwarded-for": "203.0.113.13" },
        "POST",
      ) as unknown as NextRequest,
    );

    expect(limitedResponse.status).toBe(429);
    expect(otherIpResponse.status).toBe(200);
  });

  it("does not share counters between read, order, and login policies", async () => {
    const headers = { "x-forwarded-for": "203.0.113.14" };

    for (let index = 0; index < 10; index += 1) {
      await middleware(
        createRequest("/api/orders", headers, "POST") as unknown as NextRequest,
      );
    }

    const orderResponse = await middleware(
      createRequest("/api/orders", headers, "POST") as unknown as NextRequest,
    );
    const flavorResponse = await middleware(
      createRequest("/api/flavors", headers) as unknown as NextRequest,
    );
    const loginResponse = await middleware(
      createRequest(
        "/api/admin/auth/login",
        headers,
        "POST",
      ) as unknown as NextRequest,
    );

    expect(orderResponse.status).toBe(429);
    expect(flavorResponse.status).toBe(200);
    expect(loginResponse.status).toBe(200);
  });

  it("does not rate limit protected admin apis with the public limiter", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    for (let index = 0; index < 12; index += 1) {
      const response = await middleware(
        createRequest("/api/admin/orders", {
          authorization: "Bearer token",
          "x-forwarded-for": "203.0.113.15",
        }) as unknown as NextRequest,
      );

      expect(response.status).toBe(401);
    }

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
    expect(response.headers.get("www-authenticate")).toBeNull();
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
    expect(response.headers.get("www-authenticate")).toBeNull();
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

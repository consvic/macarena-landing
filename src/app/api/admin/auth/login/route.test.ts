import { beforeEach, describe, expect, it, vi } from "vitest";

const verifyAdminCredentialsMock = vi.fn();
const createAdminSessionMock = vi.fn();

vi.mock("@/lib/admin/auth", async () => {
  const original =
    await vi.importActual<typeof import("@/lib/admin/auth")>(
      "@/lib/admin/auth",
    );

  return {
    ...original,
    verifyAdminCredentials: (...args: unknown[]) =>
      verifyAdminCredentialsMock(...args),
    unauthorizedJsonResponse: () =>
      new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      }),
  };
});

vi.mock("@/lib/admin/session", () => ({
  createAdminSession: (...args: unknown[]) => createAdminSessionMock(...args),
}));

describe("POST /api/admin/auth/login", () => {
  beforeEach(() => {
    verifyAdminCredentialsMock.mockReset();
    createAdminSessionMock.mockReset();
  });

  it("returns 401 when credentials are invalid", async () => {
    verifyAdminCredentialsMock.mockResolvedValue(null);

    const { POST } = await import("@/app/api/admin/auth/login/route");
    const response = await POST(
      new Request("http://localhost/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "admin@example.com",
          password: "wrong",
        }),
      }),
    );

    expect(response.status).toBe(401);
  });

  it("sets session cookie when credentials are valid", async () => {
    verifyAdminCredentialsMock.mockResolvedValue("admin@example.com");
    createAdminSessionMock.mockResolvedValue({
      email: "admin@example.com",
      token: "session-token",
    });

    const { POST } = await import("@/app/api/admin/auth/login/route");
    const response = await POST(
      new Request("http://localhost/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "admin@example.com",
          password: "correct-password",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain(
      "macarena_admin_session=session-token",
    );
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const revokeAdminSessionMock = vi.fn();

vi.mock("@/lib/admin/session", () => ({
  parseCookieValue: (cookieHeader: string | null, name: string) => {
    if (!cookieHeader) {
      return null;
    }

    const item = cookieHeader
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${name}=`));

    return item ? item.slice(`${name}=`.length) : null;
  },
  revokeAdminSession: (...args: unknown[]) => revokeAdminSessionMock(...args),
}));

describe("POST /api/admin/auth/logout", () => {
  beforeEach(() => {
    revokeAdminSessionMock.mockReset();
  });

  it("revokes current session token and clears cookie", async () => {
    const { POST } = await import("@/app/api/admin/auth/logout/route");
    const response = await POST(
      new Request("http://localhost/api/admin/auth/logout", {
        method: "POST",
        headers: {
          cookie: "macarena_admin_session=session-token",
        },
      }),
    );

    expect(response.status).toBe(204);
    expect(revokeAdminSessionMock).toHaveBeenCalledWith("session-token");
    expect(response.headers.get("set-cookie")).toContain(
      "macarena_admin_session=",
    );
  });
});

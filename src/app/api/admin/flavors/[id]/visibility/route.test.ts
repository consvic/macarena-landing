import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const setAdminFlavorVisibilityMock = vi.fn();

vi.mock("@/lib/admin/auth", () => ({
  getAuthorizedAdminUserFromRequest: (request: Request) => authMock(request),
  unauthorizedJsonResponse: () =>
    new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 }),
}));

vi.mock("@/lib/admin/services", () => ({
  setAdminFlavorVisibility: (...args: unknown[]) =>
    setAdminFlavorVisibilityMock(...args),
}));

describe("PATCH /api/admin/flavors/[id]/visibility", () => {
  beforeEach(() => {
    authMock.mockReset();
    setAdminFlavorVisibilityMock.mockReset();
  });

  it("returns 401 when auth fails", async () => {
    authMock.mockReturnValue(null);

    const { PATCH } = await import(
      "@/app/api/admin/flavors/[id]/visibility/route"
    );
    const response = await PATCH(
      new Request("http://localhost/api/admin/flavors/id/visibility", {
        method: "PATCH",
      }),
      { params: Promise.resolve({ id: "507f1f77bcf86cd799439011" }) },
    );

    expect(response.status).toBe(401);
  });

  it("returns 400 when payload is invalid", async () => {
    authMock.mockReturnValue("admin");

    const { PATCH } = await import(
      "@/app/api/admin/flavors/[id]/visibility/route"
    );
    const response = await PATCH(
      new Request("http://localhost/api/admin/flavors/id/visibility", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVisibleOnSite: "yes" }),
      }),
      { params: Promise.resolve({ id: "507f1f77bcf86cd799439011" }) },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: "isVisibleOnSite must be boolean",
    });
  });

  it("updates visibility when payload is valid", async () => {
    authMock.mockReturnValue("admin");
    setAdminFlavorVisibilityMock.mockResolvedValue({
      _id: "507f1f77bcf86cd799439011",
      isVisibleOnSite: true,
    });

    const { PATCH } = await import(
      "@/app/api/admin/flavors/[id]/visibility/route"
    );
    const response = await PATCH(
      new Request("http://localhost/api/admin/flavors/id/visibility", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVisibleOnSite: true }),
      }),
      { params: Promise.resolve({ id: "507f1f77bcf86cd799439011" }) },
    );

    expect(response.status).toBe(200);
    expect(setAdminFlavorVisibilityMock).toHaveBeenCalledWith(
      "507f1f77bcf86cd799439011",
      true,
      "admin",
    );
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const listAdminOrdersMock = vi.fn();

vi.mock("@/lib/admin/auth", () => ({
  getAuthorizedAdminUserFromRequest: (request: Request) => authMock(request),
  unauthorizedJsonResponse: () =>
    new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 }),
}));

vi.mock("@/lib/admin/services", () => ({
  listAdminOrders: (...args: unknown[]) => listAdminOrdersMock(...args),
}));

describe("GET /api/admin/orders", () => {
  beforeEach(() => {
    authMock.mockReset();
    listAdminOrdersMock.mockReset();
  });

  it("returns 401 when auth fails", async () => {
    authMock.mockReturnValue(null);

    const { GET } = await import("@/app/api/admin/orders/route");
    const response = await GET(
      new Request("http://localhost/api/admin/orders"),
    );

    expect(response.status).toBe(401);
  });

  it("returns paginated orders when auth succeeds", async () => {
    authMock.mockReturnValue("admin");
    listAdminOrdersMock.mockResolvedValue({
      data: [{ _id: "order-1", customerName: "Ana" }],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });

    const { GET } = await import("@/app/api/admin/orders/route");
    const response = await GET(
      new Request("http://localhost/api/admin/orders?page=1&limit=20"),
    );

    expect(response.status).toBe(200);
    expect(listAdminOrdersMock).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 20 }),
    );
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        data: [{ _id: "order-1", customerName: "Ana" }],
      }),
    );
  });
});

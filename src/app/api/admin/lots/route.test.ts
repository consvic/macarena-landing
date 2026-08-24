import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const listLotsMock = vi.fn();
const createLotMock = vi.fn();

vi.mock("@/lib/admin/auth", () => ({
  getAuthorizedAdminUserFromRequest: (request: Request) => authMock(request),
  unauthorizedJsonResponse: () =>
    new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 }),
}));

vi.mock("@/lib/admin/lots", () => ({
  listAdminLots: (...args: unknown[]) => listLotsMock(...args),
  createAdminLot: (...args: unknown[]) => createLotMock(...args),
}));

const FLAVOR_ID = "507f1f77bcf86cd799439011";

describe("/api/admin/lots", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue("admin@macarena.mx");
  });

  it("requires admin authentication", async () => {
    authMock.mockResolvedValue(null);
    const { GET } = await import("@/app/api/admin/lots/route");
    const response = await GET(
      new Request(`http://localhost/api/admin/lots?flavorId=${FLAVOR_ID}`),
    );

    expect(response.status).toBe(401);
    expect(listLotsMock).not.toHaveBeenCalled();
  });

  it("lists lots for one flavor", async () => {
    listLotsMock.mockResolvedValue({
      data: [],
      totals: { halfLiter: 0, liter: 0 },
    });
    const { GET } = await import("@/app/api/admin/lots/route");
    const response = await GET(
      new Request(`http://localhost/api/admin/lots?flavorId=${FLAVOR_ID}`),
    );

    expect(response.status).toBe(200);
    expect(listLotsMock).toHaveBeenCalledWith(FLAVOR_ID);
  });

  it("creates a lot as the authenticated admin", async () => {
    createLotMock.mockResolvedValue({ _id: "lot-1" });
    const { POST } = await import("@/app/api/admin/lots/route");
    const response = await POST(
      new Request("http://localhost/api/admin/lots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flavorId: FLAVOR_ID,
          halfLiter: 3,
          liter: 2,
        }),
      }),
    );

    expect(response.status).toBe(201);
    expect(createLotMock).toHaveBeenCalledWith(
      FLAVOR_ID,
      { flavorId: FLAVOR_ID, halfLiter: 3, liter: 2 },
      "admin@macarena.mx",
    );
  });
});

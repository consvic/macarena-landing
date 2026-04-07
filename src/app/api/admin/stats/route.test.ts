import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const getAdminStatsMock = vi.fn();

vi.mock("@/lib/admin/auth", () => ({
  getAuthorizedAdminUserFromRequest: (request: Request) => authMock(request),
  unauthorizedJsonResponse: () =>
    new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 }),
}));

vi.mock("@/lib/admin/services", () => ({
  getAdminStats: (...args: unknown[]) => getAdminStatsMock(...args),
}));

describe("GET /api/admin/stats", () => {
  beforeEach(() => {
    authMock.mockReset();
    getAdminStatsMock.mockReset();
  });

  it("returns 401 when auth fails", async () => {
    authMock.mockReturnValue(null);

    const { GET } = await import("@/app/api/admin/stats/route");
    const response = await GET(new Request("http://localhost/api/admin/stats"));

    expect(response.status).toBe(401);
  });

  it("returns stats payload", async () => {
    authMock.mockReturnValue("admin");
    getAdminStatsMock.mockResolvedValue({
      range: { dateFrom: "2026-03-01", dateTo: "2026-03-30" },
      summary: {
        totalOrders: 5,
        totalRevenue: 1000,
        averageSpendPerOrder: 200,
        averageLitersPerOrder: 1.2,
      },
      topFlavors: [],
      frequentBuyers: [],
      topSpenders: [],
    });

    const { GET } = await import("@/app/api/admin/stats/route");
    const response = await GET(
      new Request(
        "http://localhost/api/admin/stats?dateFrom=2026-03-01&dateTo=2026-03-30&topN=10",
      ),
    );

    expect(response.status).toBe(200);
    expect(getAdminStatsMock).toHaveBeenCalledWith({
      dateFrom: "2026-03-01",
      dateTo: "2026-03-30",
      topN: 10,
    });
  });
});

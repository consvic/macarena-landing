import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const getDemandMock = vi.fn();

vi.mock("@/lib/admin/auth", () => ({
  getAuthorizedAdminUserFromRequest: (request: Request) => authMock(request),
  unauthorizedJsonResponse: () =>
    new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 }),
}));

vi.mock("@/lib/admin/production-demand", () => ({
  getAdminProductionDemand: (...args: unknown[]) => getDemandMock(...args),
}));

describe("GET /api/admin/production-demand", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requires an authenticated admin", async () => {
    authMock.mockReturnValue(null);
    const { GET } = await import("@/app/api/admin/production-demand/route");

    const response = await GET(
      new Request("http://localhost/api/admin/production-demand"),
    );

    expect(response.status).toBe(401);
    expect(getDemandMock).not.toHaveBeenCalled();
  });

  it("returns demand for the requested production date", async () => {
    authMock.mockReturnValue("admin@example.com");
    getDemandMock.mockResolvedValue({ date: "2026-08-22", entries: [] });
    const { GET } = await import("@/app/api/admin/production-demand/route");

    const response = await GET(
      new Request(
        "http://localhost/api/admin/production-demand?date=2026-08-22",
      ),
    );

    expect(response.status).toBe(200);
    expect(getDemandMock).toHaveBeenCalledWith("2026-08-22");
  });
});

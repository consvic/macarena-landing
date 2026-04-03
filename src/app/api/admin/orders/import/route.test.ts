import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const importOrdersFromCsvMock = vi.fn();

vi.mock("@/lib/admin/auth", () => ({
  getAuthorizedAdminUserFromRequest: (request: Request) => authMock(request),
  unauthorizedJsonResponse: () =>
    new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 }),
}));

vi.mock("@/lib/admin/services", async () => {
  const original = await vi.importActual<typeof import("@/lib/admin/services")>(
    "@/lib/admin/services",
  );

  return {
    ...original,
    importOrdersFromCsv: (...args: unknown[]) =>
      importOrdersFromCsvMock(...args),
  };
});

describe("POST /api/admin/orders/import", () => {
  beforeEach(() => {
    authMock.mockReset();
    importOrdersFromCsvMock.mockReset();
  });

  it("returns 401 when auth fails", async () => {
    authMock.mockReturnValue(null);

    const { POST } = await import("@/app/api/admin/orders/import/route");
    const response = await POST(
      new Request("http://localhost/api/admin/orders/import", {
        method: "POST",
      }),
    );

    expect(response.status).toBe(401);
  });

  it("returns 400 when file is missing", async () => {
    authMock.mockReturnValue("admin");

    const { POST } = await import("@/app/api/admin/orders/import/route");
    const response = await POST(
      new Request("http://localhost/api/admin/orders/import", {
        method: "POST",
        body: new FormData(),
      }),
    );

    expect(response.status).toBe(400);
  });

  it("imports csv and returns summary", async () => {
    authMock.mockReturnValue("admin");
    importOrdersFromCsvMock.mockResolvedValue({
      importedOrders: 2,
      importedItems: 3,
      totalRevenue: 860,
    });

    const formData = new FormData();
    formData.set(
      "file",
      new File(["header"], "orders.csv", { type: "text/csv" }),
    );

    const { POST } = await import("@/app/api/admin/orders/import/route");
    const response = await POST(
      new Request("http://localhost/api/admin/orders/import", {
        method: "POST",
        body: formData,
      }),
    );

    expect(response.status).toBe(201);
    expect(importOrdersFromCsvMock).toHaveBeenCalledWith(
      expect.any(String),
      "admin",
    );
  });
});

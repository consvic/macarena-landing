import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const updateStatusMock = vi.fn();
const sendConfirmedEmailMock = vi.fn();

vi.mock("@/lib/admin/auth", () => ({
  getAuthorizedAdminUserFromRequest: (request: Request) => authMock(request),
  unauthorizedJsonResponse: () =>
    new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 }),
}));

vi.mock("@/lib/admin/services", () => ({
  updateAdminOrderStatus: (...args: unknown[]) => updateStatusMock(...args),
}));

vi.mock("@/lib/email/order-notifications", () => ({
  sendOrderConfirmedEmail: (...args: unknown[]) =>
    sendConfirmedEmailMock(...args),
}));

const confirmedOrder = {
  _id: "507f1f77bcf86cd799439011",
  customerName: "Ana Gomez",
  customerEmail: "ana@example.com",
  status: "confirmed",
  currency: "MXN",
  totalPrice: 320,
  itemCount: 1,
  createdAt: "2026-08-23T12:00:00.000Z",
  items: [
    {
      _id: "507f1f77bcf86cd799439012",
      flavorName: "Pistache",
      presentation: "1 litro",
      quantity: 1,
      unitPrice: 320,
      subtotal: 320,
    },
  ],
};

function patchConfirmedOrder() {
  return new Request(
    `http://localhost/api/admin/orders/${confirmedOrder._id}/status`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "confirmed" }),
    },
  );
}

describe("PATCH /api/admin/orders/[id]/status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockReturnValue("admin@macarena.mx");
  });

  it("emails the customer when an order becomes confirmed", async () => {
    updateStatusMock.mockResolvedValue({
      order: confirmedOrder,
      previousStatus: "pending_confirmation",
    });

    const { PATCH } = await import("@/app/api/admin/orders/[id]/status/route");
    const response = await PATCH(patchConfirmedOrder(), {
      params: Promise.resolve({ id: confirmedOrder._id }),
    });

    expect(response.status).toBe(200);
    expect(updateStatusMock).toHaveBeenCalledWith(
      confirmedOrder._id,
      "confirmed",
      "admin@macarena.mx",
    );
    expect(sendConfirmedEmailMock).toHaveBeenCalledOnce();
    expect(sendConfirmedEmailMock).toHaveBeenCalledWith(confirmedOrder);
  });

  it("does not resend confirmation for an already confirmed order", async () => {
    updateStatusMock.mockResolvedValue({
      order: confirmedOrder,
      previousStatus: "confirmed",
    });

    const { PATCH } = await import("@/app/api/admin/orders/[id]/status/route");
    const response = await PATCH(patchConfirmedOrder(), {
      params: Promise.resolve({ id: confirmedOrder._id }),
    });

    expect(response.status).toBe(200);
    expect(sendConfirmedEmailMock).not.toHaveBeenCalled();
  });
});

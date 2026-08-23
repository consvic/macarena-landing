import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const updateStatusMock = vi.fn();
const sendConfirmedEmailMock = vi.fn();
const afterMock = vi.fn();

vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>();
  return {
    ...actual,
    after: (...args: unknown[]) => afterMock(...args),
  };
});

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

  it("schedules the confirmation email after responding", async () => {
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
    expect(afterMock).toHaveBeenCalledOnce();
    expect(sendConfirmedEmailMock).not.toHaveBeenCalled();

    const sendEmailAfterResponse = afterMock.mock.calls[0]?.[0];
    expect(sendEmailAfterResponse).toBeTypeOf("function");
    await sendEmailAfterResponse();

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
    expect(afterMock).not.toHaveBeenCalled();
    expect(sendConfirmedEmailMock).not.toHaveBeenCalled();
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn() }));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: sendMock };
  },
}));

vi.mock("@react-email/render", () => ({
  render: vi.fn().mockResolvedValue("<html>Order</html>"),
}));

const order = {
  _id: "order-1",
  customerName: "Ana Gomez",
  customerEmail: "ana@example.com",
  status: "pending_confirmation" as const,
  totalPrice: 320,
  currency: "MXN",
  items: [
    {
      flavorName: "Pistache",
      presentation: "1 litro" as const,
      quantity: 1,
      subtotal: 320,
    },
  ],
};

describe("order email notifications", () => {
  beforeEach(() => {
    vi.resetModules();
    sendMock.mockReset();
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("RESEND_FROM_EMAIL", "orders@example.com");
  });

  afterEach(() => vi.unstubAllEnvs());

  it("bccs the configured admin on new orders", async () => {
    vi.stubEnv("ORDER_NOTIFICATION_BCC_EMAIL", " admin@example.com ");
    const { sendOrderPendingEmail } = await import(
      "@/lib/email/order-notifications"
    );

    await sendOrderPendingEmail(order);

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "ana@example.com",
        bcc: "admin@example.com",
      }),
    );
  });

  it("does not add a bcc when the variable is empty", async () => {
    vi.stubEnv("ORDER_NOTIFICATION_BCC_EMAIL", "");
    const { sendOrderPendingEmail } = await import(
      "@/lib/email/order-notifications"
    );

    await sendOrderPendingEmail(order);

    expect(sendMock.mock.calls[0]?.[0]).not.toHaveProperty("bcc");
  });

  it("does not bcc status confirmation emails", async () => {
    vi.stubEnv("ORDER_NOTIFICATION_BCC_EMAIL", "admin@example.com");
    const { sendOrderConfirmedEmail } = await import(
      "@/lib/email/order-notifications"
    );

    await sendOrderConfirmedEmail({ ...order, status: "confirmed" });

    expect(sendMock.mock.calls[0]?.[0]).not.toHaveProperty("bcc");
  });
});

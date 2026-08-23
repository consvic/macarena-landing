import { beforeEach, describe, expect, it, vi } from "vitest";

const connectToDatabaseMock = vi.fn();
const createMock = vi.fn();
const findByIdAndDeleteMock = vi.fn();
const insertManyMock = vi.fn();
const sendOrderPendingEmailMock = vi.fn();
const findFlavorsLeanMock = vi.fn();
const findFlavorsMock = vi.fn((..._args: unknown[]) => ({
  lean: findFlavorsLeanMock,
}));

vi.mock("@/lib/db/mongoose", () => ({
  connectToDatabase: () => connectToDatabaseMock(),
}));

vi.mock("@/models/Order", () => ({
  OrderModel: {
    create: (...args: unknown[]) => createMock(...args),
    findByIdAndDelete: (...args: unknown[]) => findByIdAndDeleteMock(...args),
  },
}));

vi.mock("@/models/OrderItem", () => ({
  OrderItemModel: {
    insertMany: (...args: unknown[]) => insertManyMock(...args),
  },
}));

vi.mock("@/models/Flavor", () => ({
  FlavorModel: {
    find: (...args: unknown[]) => findFlavorsMock(...args),
  },
}));

vi.mock("@/lib/email/order-notifications", () => ({
  sendOrderPendingEmail: (...args: unknown[]) =>
    sendOrderPendingEmailMock(...args),
}));

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const FAKE_ORDER = {
  _id: "order-1",
  customerName: "test",
  customerEmail: "test@example.com",
  status: "pending_confirmation",
  currency: "MXN",
  totalPrice: 150,
  itemCount: 1,
};

const FAKE_ITEMS = [
  {
    _id: "item-1",
    flavorName: "Mango",
    presentation: "1/2 litro",
    quantity: 1,
    unitPrice: 150,
    subtotal: 150,
    orderId: "order-1",
  },
];

const FAKE_FLAVORS = [
  {
    _id: "507f1f77bcf86cd799439011",
    name: "Mango",
    price: { halfLiter: 150, liter: 280 },
  },
  {
    _id: "507f1f77bcf86cd799439012",
    name: "Coco",
    price: { halfLiter: 150, liter: 280 },
  },
];

describe("POST /api/orders", () => {
  beforeEach(() => {
    connectToDatabaseMock.mockReset();
    createMock.mockReset();
    findByIdAndDeleteMock.mockReset();
    insertManyMock.mockReset();
    sendOrderPendingEmailMock.mockReset();
    findFlavorsMock.mockClear();
    findFlavorsLeanMock.mockReset();
    findFlavorsLeanMock.mockResolvedValue(FAKE_FLAVORS);

    createMock.mockResolvedValue({
      ...FAKE_ORDER,
      toObject: () => FAKE_ORDER,
    });
    insertManyMock.mockResolvedValue(
      FAKE_ITEMS.map((item) => ({ ...item, toObject: () => item })),
    );
  });

  it("returns 400 when customerEmail is missing", async () => {
    const { POST } = await import("@/app/api/orders/route");
    const response = await POST(
      makeRequest({ items: [{ flavorName: "Mango", unitPrice: 150 }] }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: "Customer email is required",
    });
    expect(createMock).not.toHaveBeenCalled();
  });

  it("returns 400 when items array is empty", async () => {
    const { POST } = await import("@/app/api/orders/route");
    const response = await POST(
      makeRequest({ customerEmail: "test@example.com", items: [] }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: "Order requires at least one item",
    });
  });

  it("creates order with hardcoded status and currency", async () => {
    const { POST } = await import("@/app/api/orders/route");
    const response = await POST(
      makeRequest({
        customerEmail: "test@example.com",
        status: "confirmed",
        currency: "USD",
        items: [
          {
            flavorId: "507f1f77bcf86cd799439011",
            flavorName: "Mango",
            presentation: "1/2 litro",
            quantity: 1,
            unitPrice: 150,
          },
        ],
      }),
    );

    expect(response.status).toBe(201);
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "pending_confirmation",
        currency: "MXN",
      }),
    );
  });

  it("computes totalPrice and itemCount correctly", async () => {
    const { POST } = await import("@/app/api/orders/route");
    await POST(
      makeRequest({
        customerEmail: "test@example.com",
        items: [
          {
            flavorName: "Mango",
            presentation: "1/2 litro",
            quantity: 2,
            unitPrice: 150,
          },
          {
            flavorName: "Coco",
            presentation: "1 litro",
            quantity: 1,
            unitPrice: 280,
          },
        ],
      }),
    );

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        totalPrice: 580,
        itemCount: 3,
      }),
    );
  });

  it("stores a trimmed customerPhone when provided", async () => {
    const { POST } = await import("@/app/api/orders/route");
    await POST(
      makeRequest({
        customerEmail: "test@example.com",
        customerPhone: "  +52 55 1234 5678  ",
        items: [
          {
            flavorName: "Mango",
            presentation: "1/2 litro",
            quantity: 1,
            unitPrice: 150,
          },
        ],
      }),
    );

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        customerPhone: "+52 55 1234 5678",
      }),
    );
  });

  it("omits customerPhone when the optional value is blank", async () => {
    const { POST } = await import("@/app/api/orders/route");
    await POST(
      makeRequest({
        customerEmail: "test@example.com",
        customerPhone: "   ",
        items: [
          {
            flavorName: "Mango",
            presentation: "1/2 litro",
            quantity: 1,
            unitPrice: 150,
          },
        ],
      }),
    );

    expect(createMock.mock.calls[0]?.[0]).not.toHaveProperty("customerPhone");
  });

  it("returns 201 even when email send fails", async () => {
    sendOrderPendingEmailMock.mockRejectedValue(new Error("Resend is down"));

    const { POST } = await import("@/app/api/orders/route");
    const response = await POST(
      makeRequest({
        customerEmail: "test@example.com",
        items: [
          {
            flavorName: "Mango",
            presentation: "1/2 litro",
            quantity: 1,
            unitPrice: 150,
          },
        ],
      }),
    );

    expect(response.status).toBe(201);
    expect(sendOrderPendingEmailMock).toHaveBeenCalled();
  });

  it("returns 500 when database fails", async () => {
    createMock.mockRejectedValue(new Error("DB down"));

    const { POST } = await import("@/app/api/orders/route");
    const response = await POST(
      makeRequest({
        customerEmail: "test@example.com",
        items: [
          {
            flavorName: "Mango",
            presentation: "1/2 litro",
            quantity: 1,
            unitPrice: 150,
          },
        ],
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      message: "Internal server error",
    });
  });

  it("ignores a client-supplied price and uses the canonical flavor price", async () => {
    const { POST } = await import("@/app/api/orders/route");
    const response = await POST(
      makeRequest({
        customerEmail: "test@example.com",
        items: [
          {
            flavorId: "507f1f77bcf86cd799439011",
            flavorName: "Forged flavor name",
            presentation: "1/2 litro",
            quantity: 1,
            unitPrice: 0,
          },
        ],
      }),
    );

    expect(response.status).toBe(201);
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({ totalPrice: 150 }),
    );
    expect(insertManyMock).toHaveBeenCalledWith([
      expect.objectContaining({ unitPrice: 150, subtotal: 150 }),
    ]);
  });

  it("returns 400 when the flavor is unavailable", async () => {
    findFlavorsLeanMock.mockResolvedValue([]);
    const { POST } = await import("@/app/api/orders/route");
    const response = await POST(
      makeRequest({
        customerEmail: "test@example.com",
        items: [
          {
            flavorName: "Mango",
            presentation: "1/2 litro",
            quantity: 1,
          },
        ],
      }),
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.message).toContain("Flavor not found");
    expect(createMock).not.toHaveBeenCalled();
  });

  it("returns 400 when quantity is zero", async () => {
    const { POST } = await import("@/app/api/orders/route");
    const response = await POST(
      makeRequest({
        customerEmail: "test@example.com",
        items: [
          {
            flavorName: "Mango",
            presentation: "1/2 litro",
            quantity: 0,
            unitPrice: 150,
          },
        ],
      }),
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.message).toContain("Invalid quantity");
  });

  it("defaults quantity to 1 when not provided", async () => {
    const { POST } = await import("@/app/api/orders/route");
    await POST(
      makeRequest({
        customerEmail: "test@example.com",
        items: [
          { flavorName: "Mango", presentation: "1/2 litro", unitPrice: 150 },
        ],
      }),
    );

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        totalPrice: 150,
        itemCount: 1,
      }),
    );
  });

  it("cleans up order when item insertion fails", async () => {
    insertManyMock.mockRejectedValue(new Error("Insert failed"));
    findByIdAndDeleteMock.mockResolvedValue(FAKE_ORDER);

    const { POST } = await import("@/app/api/orders/route");
    const response = await POST(
      makeRequest({
        customerEmail: "test@example.com",
        items: [
          {
            flavorName: "Mango",
            presentation: "1/2 litro",
            quantity: 1,
            unitPrice: 150,
          },
        ],
      }),
    );

    expect(response.status).toBe(500);
    expect(findByIdAndDeleteMock).toHaveBeenCalledWith("order-1");
  });

  it("falls back to email prefix for customerName", async () => {
    const { POST } = await import("@/app/api/orders/route");
    await POST(
      makeRequest({
        customerEmail: "maria@example.com",
        items: [
          {
            flavorName: "Mango",
            presentation: "1/2 litro",
            quantity: 1,
            unitPrice: 150,
          },
        ],
      }),
    );

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        customerName: "maria",
      }),
    );
  });
});

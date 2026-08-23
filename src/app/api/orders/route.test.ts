import { beforeEach, describe, expect, it, vi } from "vitest";

const connectToDatabaseMock = vi.fn();
const createMock = vi.fn();
const findByIdAndDeleteMock = vi.fn();
const insertManyMock = vi.fn();
const findFlavorsMock = vi.fn();
const leanFlavorsMock = vi.fn();
const sendOrderPendingEmailMock = vi.fn();

vi.mock("@/lib/db/mongoose", () => ({
  connectToDatabase: () => connectToDatabaseMock(),
}));

vi.mock("@/models/Flavor", () => ({
  FlavorModel: {
    find: (...args: unknown[]) => findFlavorsMock(...args),
  },
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

vi.mock("@/lib/email/order-notifications", () => ({
  sendOrderPendingEmail: (...args: unknown[]) =>
    sendOrderPendingEmailMock(...args),
}));

const MANGO_ID = "507f1f77bcf86cd799439011";
const COCO_ID = "507f191e810c19729de860ea";
const FLAVORS = [
  {
    _id: MANGO_ID,
    name: "Mango",
    price: { halfLiter: 150, liter: 280 },
  },
  {
    _id: COCO_ID,
    name: "Coco",
    price: { halfLiter: 160, liter: 300 },
  },
];

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function item(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    flavorId: MANGO_ID,
    flavorName: "Mango viejo",
    presentation: "1/2 litro",
    quantity: 1,
    ...overrides,
  };
}

describe("POST /api/orders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findFlavorsMock.mockReturnValue({ lean: leanFlavorsMock });
    leanFlavorsMock.mockResolvedValue(FLAVORS);
    createMock.mockResolvedValue({
      _id: "order-1",
      toObject: () => ({ _id: "order-1", status: "pending_confirmation" }),
    });
    insertManyMock.mockImplementation((items: unknown[]) =>
      Promise.resolve(
        items.map((savedItem) => ({
          toObject: () => savedItem,
        })),
      ),
    );
  });

  it("rejects missing customer details or items before writing", async () => {
    const { POST } = await import("@/app/api/orders/route");

    const missingEmail = await POST(makeRequest({ items: [item()] }));
    expect(missingEmail.status).toBe(400);

    const emptyOrder = await POST(
      makeRequest({ customerEmail: "test@example.com", items: [] }),
    );
    expect(emptyOrder.status).toBe(400);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("uses current flavor names and prices from the database", async () => {
    const { POST } = await import("@/app/api/orders/route");
    const response = await POST(
      makeRequest({
        customerEmail: "test@example.com",
        status: "confirmed",
        currency: "USD",
        items: [
          item({ quantity: 2, unitPrice: 1 }),
          item({
            flavorId: COCO_ID,
            flavorName: "Not Coco",
            presentation: "1 litro",
            unitPrice: 1,
          }),
        ],
      }),
    );

    expect(response.status).toBe(201);
    expect(findFlavorsMock).toHaveBeenCalledWith({
      _id: { $in: [MANGO_ID, COCO_ID] },
      exists: true,
      isVisibleOnSite: { $ne: false },
      isArchived: { $ne: true },
    });
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "pending_confirmation",
        currency: "MXN",
        totalPrice: 600,
        itemCount: 3,
      }),
    );
    expect(insertManyMock).toHaveBeenCalledWith([
      expect.objectContaining({
        flavorId: MANGO_ID,
        flavorName: "Mango",
        unitPrice: 150,
        subtotal: 300,
      }),
      expect.objectContaining({
        flavorId: COCO_ID,
        flavorName: "Coco",
        unitPrice: 300,
        subtotal: 300,
      }),
    ]);
  });

  it("rejects the whole order when one flavor was hidden after being added", async () => {
    leanFlavorsMock.mockResolvedValue([FLAVORS[0]]);

    const { POST } = await import("@/app/api/orders/route");
    const response = await POST(
      makeRequest({
        customerEmail: "test@example.com",
        items: [
          item(),
          item({
            flavorId: COCO_ID,
            flavorName: "Coco",
            presentation: "1 litro",
          }),
        ],
      }),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      message:
        "Coco ya no está disponible. Retíralo del carrito para continuar.",
    });
    expect(createMock).not.toHaveBeenCalled();
  });

  it("rejects a presentation disabled after it was added to the cart", async () => {
    leanFlavorsMock.mockResolvedValue([
      { ...FLAVORS[0], availablePresentations: ["1/2 litro"] },
    ]);

    const { POST } = await import("@/app/api/orders/route");
    const response = await POST(
      makeRequest({
        customerEmail: "test@example.com",
        items: [item({ presentation: "1 litro" })],
      }),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      message:
        "1 litro de Mango ya no está disponible. Retíralo del carrito para continuar.",
    });
    expect(createMock).not.toHaveBeenCalled();
  });

  it.each([
    ["invalid flavor id", item({ flavorId: "not-an-id" }), "Invalid flavor"],
    [
      "invalid presentation",
      item({ presentation: "cono" }),
      'Invalid presentation for "Mango viejo"',
    ],
    [
      "fractional quantity",
      item({ quantity: 0.5 }),
      'Invalid quantity for "Mango viejo"',
    ],
  ])("returns 400 for %s", async (_label, orderItem, message) => {
    const { POST } = await import("@/app/api/orders/route");
    const response = await POST(
      makeRequest({ customerEmail: "test@example.com", items: [orderItem] }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ message });
    expect(createMock).not.toHaveBeenCalled();
  });

  it("cleans up the order when item insertion fails", async () => {
    insertManyMock.mockRejectedValue(new Error("Insert failed"));

    const { POST } = await import("@/app/api/orders/route");
    const response = await POST(
      makeRequest({ customerEmail: "test@example.com", items: [item()] }),
    );

    expect(response.status).toBe(500);
    expect(findByIdAndDeleteMock).toHaveBeenCalledWith("order-1");
  });

  it("keeps a saved order when email delivery fails", async () => {
    sendOrderPendingEmailMock.mockRejectedValue(new Error("Resend is down"));

    const { POST } = await import("@/app/api/orders/route");
    const response = await POST(
      makeRequest({ customerEmail: "test@example.com", items: [item()] }),
    );

    expect(response.status).toBe(201);
    expect(sendOrderPendingEmailMock).toHaveBeenCalled();
  });
});

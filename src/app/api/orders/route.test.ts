import { beforeEach, describe, expect, it, vi } from "vitest";

const connectToDatabaseMock = vi.fn();
const createMock = vi.fn();
const insertManyMock = vi.fn();
const findFlavorsMock = vi.fn();
const leanFlavorsMock = vi.fn();
const findLotsMock = vi.fn();
const sortLotsMock = vi.fn();
const leanLotsMock = vi.fn();
const updateLotMock = vi.fn();
const sendOrderPendingEmailMock = vi.fn();
const withTransactionMock = vi.fn();
const endSessionMock = vi.fn();
const session = {
  withTransaction: withTransactionMock,
  endSession: endSessionMock,
};

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
  },
}));

vi.mock("@/models/Lot", () => ({
  LotModel: {
    find: (...args: unknown[]) => findLotsMock(...args),
    updateOne: (...args: unknown[]) => updateLotMock(...args),
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

function makeRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ customerName: "Test Customer", ...body }),
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
    connectToDatabaseMock.mockResolvedValue({
      startSession: () => Promise.resolve(session),
    });
    withTransactionMock.mockImplementation((callback: () => unknown) =>
      callback(),
    );
    findFlavorsMock.mockReturnValue({ lean: leanFlavorsMock });
    findLotsMock.mockReturnValue({ sort: sortLotsMock });
    sortLotsMock.mockReturnValue({ lean: leanLotsMock });
    leanLotsMock.mockResolvedValue([]);
    updateLotMock.mockResolvedValue({ modifiedCount: 1 });
    leanFlavorsMock.mockResolvedValue(FLAVORS);
    createMock.mockResolvedValue([
      {
        _id: "order-1",
        toObject: () => ({
          _id: "order-1",
          customerName: "Test Customer",
          customerEmail: "test@example.com",
          status: "pending_confirmation",
          currency: "MXN",
          totalPrice: 150,
        }),
      },
    ]);
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

    const missingName = await POST(
      makeRequest({
        customerName: " ",
        customerEmail: "test@example.com",
        items: [item()],
      }),
    );
    expect(missingName.status).toBe(400);
    await expect(missingName.json()).resolves.toEqual({
      message: "Customer name is required",
    });

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
        customerName: "  Ana López  ",
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
    expect(findFlavorsMock).toHaveBeenCalledWith(
      {
        _id: { $in: [MANGO_ID, COCO_ID] },
        exists: true,
        isVisibleOnSite: { $ne: false },
        isArchived: { $ne: true },
      },
      null,
      { session },
    );
    expect(createMock).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          customerName: "Ana López",
          status: "pending_confirmation",
          currency: "MXN",
          totalPrice: 600,
          itemCount: 3,
        }),
      ],
      { session },
    );
    expect(insertManyMock).toHaveBeenCalledWith(
      [
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
      ],
      { session },
    );
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
      message: "Algunos sabores ya no tienen disponibilidad suficiente.",
      unavailableItems: [
        expect.objectContaining({ flavorId: COCO_ID, flavorName: "Coco" }),
      ],
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
      message: "Algunos sabores ya no tienen disponibilidad suficiente.",
      unavailableItems: [
        expect.objectContaining({
          flavorId: MANGO_ID,
          flavorName: "Mango",
          presentation: "1 litro",
        }),
      ],
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

  it("aborts the transaction when item insertion fails", async () => {
    insertManyMock.mockRejectedValue(new Error("Insert failed"));

    const { POST } = await import("@/app/api/orders/route");
    const response = await POST(
      makeRequest({ customerEmail: "test@example.com", items: [item()] }),
    );

    expect(response.status).toBe(500);
    expect(endSessionMock).toHaveBeenCalled();
  });

  it("aggregates demand and reserves managed inventory oldest-first", async () => {
    leanFlavorsMock.mockResolvedValue([
      { ...FLAVORS[0], inventoryManaged: true },
    ]);
    leanLotsMock.mockResolvedValue([
      {
        _id: "lot-1",
        flavorId: MANGO_ID,
        remaining: { halfLiter: 1, liter: 0 },
      },
      {
        _id: "lot-2",
        flavorId: MANGO_ID,
        remaining: { halfLiter: 3, liter: 0 },
      },
    ]);

    const { POST } = await import("@/app/api/orders/route");
    const response = await POST(
      makeRequest({
        customerEmail: "test@example.com",
        items: [item(), item({ flavorName: "Mango", quantity: 2 })],
      }),
    );

    expect(response.status).toBe(201);
    expect(updateLotMock).toHaveBeenNthCalledWith(
      1,
      { _id: "lot-1", "remaining.halfLiter": { $gte: 1 } },
      { $inc: { "remaining.halfLiter": -1 } },
      { session },
    );
    expect(updateLotMock).toHaveBeenNthCalledWith(
      2,
      { _id: "lot-2", "remaining.halfLiter": { $gte: 2 } },
      { $inc: { "remaining.halfLiter": -2 } },
      { session },
    );
    expect(insertManyMock).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          quantity: 3,
          lotAllocations: [
            { lotId: "lot-1", quantity: 1 },
            { lotId: "lot-2", quantity: 2 },
          ],
        }),
      ],
      { session },
    );
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

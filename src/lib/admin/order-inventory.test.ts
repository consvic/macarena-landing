import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

const connectMock = vi.fn();
const findOrderMock = vi.fn();
const leanOrderMock = vi.fn();
const updateOrderMock = vi.fn();
const leanUpdatedOrderMock = vi.fn();
const findItemsMock = vi.fn();
const sortItemsMock = vi.fn();
const leanItemsMock = vi.fn();
const updateLotMock = vi.fn();
const withTransactionMock = vi.fn();
const endSessionMock = vi.fn();
const session = {
  withTransaction: withTransactionMock,
  endSession: endSessionMock,
};

vi.mock("@/lib/db/mongoose", () => ({
  connectToDatabase: () => connectMock(),
}));

vi.mock("@/models/Order", () => ({
  OrderModel: {
    findById: (...args: unknown[]) => findOrderMock(...args),
    findByIdAndUpdate: (...args: unknown[]) => updateOrderMock(...args),
  },
}));

vi.mock("@/models/OrderItem", () => ({
  OrderItemModel: {
    find: (...args: unknown[]) => findItemsMock(...args),
  },
}));

vi.mock("@/models/Lot", () => ({
  LotModel: {
    updateOne: (...args: unknown[]) => updateLotMock(...args),
  },
}));

vi.mock("@/models/Flavor", () => ({ FlavorModel: {} }));

const ORDER_ID = "507f1f77bcf86cd799439011";

describe("order inventory status changes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    connectMock.mockResolvedValue(undefined);
    vi.spyOn(mongoose, "startSession").mockResolvedValue(session as never);
    withTransactionMock.mockImplementation((callback: () => unknown) =>
      callback(),
    );
    findOrderMock.mockReturnValue({ lean: leanOrderMock });
    updateOrderMock.mockReturnValue({ lean: leanUpdatedOrderMock });
    findItemsMock.mockReturnValue({ sort: sortItemsMock });
    sortItemsMock.mockReturnValue({ lean: leanItemsMock });
    leanOrderMock.mockResolvedValue({
      _id: ORDER_ID,
      status: "pending_confirmation",
    });
    leanUpdatedOrderMock.mockResolvedValue({
      _id: ORDER_ID,
      customerName: "Ana",
      customerEmail: "ana@example.com",
      status: "cancelled",
      currency: "MXN",
      totalPrice: 150,
      itemCount: 1,
      createdAt: new Date(),
    });
    leanItemsMock.mockResolvedValue([
      {
        _id: "item-1",
        presentation: "1/2 litro",
        flavorName: "Mango",
        quantity: 3,
        unitPrice: 150,
        subtotal: 450,
        lotAllocations: [
          { lotId: "lot-1", quantity: 1 },
          { lotId: "lot-2", quantity: 2 },
        ],
      },
    ]);
  });

  it("restores every lot allocation exactly once on cancellation", async () => {
    const { updateAdminOrderStatus } = await import("@/lib/admin/services");
    await updateAdminOrderStatus(ORDER_ID, "cancelled", "admin@macarena.mx");

    expect(updateLotMock).toHaveBeenNthCalledWith(
      1,
      { _id: "lot-1" },
      { $inc: { "remaining.halfLiter": 1 } },
      { session },
    );
    expect(updateLotMock).toHaveBeenNthCalledWith(
      2,
      { _id: "lot-2" },
      { $inc: { "remaining.halfLiter": 2 } },
      { session },
    );
  });

  it("does not let a cancelled order become active again", async () => {
    leanOrderMock.mockResolvedValue({ _id: ORDER_ID, status: "cancelled" });
    const { updateAdminOrderStatus } = await import("@/lib/admin/services");

    await expect(
      updateAdminOrderStatus(ORDER_ID, "confirmed", "admin@macarena.mx"),
    ).rejects.toThrow("Cancelled order is final");
    expect(updateLotMock).not.toHaveBeenCalled();
    expect(updateOrderMock).not.toHaveBeenCalled();
  });
});

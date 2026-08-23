import { describe, expect, it } from "vitest";
import { summarizeProductionDemand } from "@/lib/admin/production-demand";

describe("summarizeProductionDemand", () => {
  it("separates pending requests from committed production and excludes cancellations", () => {
    const entries = summarizeProductionDemand(
      [
        { _id: "pending-1", status: "pending_confirmation" },
        { _id: "confirmed-1", status: "confirmed" },
        { _id: "paid-1", status: "paid" },
        { _id: "delivered-1", status: "delivered" },
        { _id: "cancelled-1", status: "cancelled" },
      ],
      [
        {
          orderId: "pending-1",
          flavorId: "mango",
          flavorName: "Mango",
          presentation: "1/2 litro",
          quantity: 2,
        },
        {
          orderId: "confirmed-1",
          flavorId: "mango",
          flavorName: "Mango",
          presentation: "1 litro",
          quantity: 1,
        },
        {
          orderId: "confirmed-1",
          flavorId: "mango",
          flavorName: "Mango",
          presentation: "1/2 litro",
          quantity: 1,
        },
        {
          orderId: "paid-1",
          flavorId: "mango",
          flavorName: "Mango",
          presentation: "1 litro",
          quantity: 1,
        },
        {
          orderId: "delivered-1",
          flavorId: "coco",
          flavorName: "Coco",
          presentation: "1 litro",
          quantity: 1,
        },
        {
          orderId: "cancelled-1",
          flavorId: "mango",
          flavorName: "Mango",
          presentation: "1 litro",
          quantity: 10,
        },
      ],
    );

    expect(entries).toEqual([
      {
        flavorId: "coco",
        flavorName: "Coco",
        pendingOrders: 0,
        pendingUnits: 0,
        pendingLiters: 0,
        committedOrders: 1,
        committedUnits: 1,
        committedLiters: 1,
      },
      {
        flavorId: "mango",
        flavorName: "Mango",
        pendingOrders: 1,
        pendingUnits: 2,
        pendingLiters: 1,
        committedOrders: 2,
        committedUnits: 3,
        committedLiters: 2.5,
      },
    ]);
  });
});

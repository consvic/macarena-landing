import { parseDateOnlyToRangeBoundary } from "@/lib/admin/datetime";
import { connectToDatabase } from "@/lib/db/mongoose";
import type { OrderStatus } from "@/lib/types";
import { OrderModel } from "@/models/Order";
import { OrderItemModel } from "@/models/OrderItem";

const COMMITTED_STATUSES = new Set<OrderStatus>([
  "confirmed",
  "paid",
  "delivered",
]);

type DemandOrder = {
  _id: unknown;
  status: OrderStatus;
};

type DemandItem = {
  orderId: unknown;
  flavorId?: unknown;
  flavorName?: unknown;
  presentation?: unknown;
  quantity?: unknown;
};

export type ProductionDemandEntry = {
  flavorId?: string;
  flavorName: string;
  pendingOrders: number;
  pendingUnits: number;
  pendingLiters: number;
  committedOrders: number;
  committedUnits: number;
  committedLiters: number;
};

export type ProductionDemandResponse = {
  date: string;
  entries: ProductionDemandEntry[];
};

function todayInMexicoCity() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return `${value.year}-${value.month}-${value.day}`;
}

export function summarizeProductionDemand(
  orders: DemandOrder[],
  items: DemandItem[],
): ProductionDemandEntry[] {
  const statusByOrderId = new Map(
    orders.map((order) => [String(order._id), order.status]),
  );
  const entries = new Map<
    string,
    ProductionDemandEntry & {
      pendingOrderIds: Set<string>;
      committedOrderIds: Set<string>;
    }
  >();

  for (const item of items) {
    const orderId = String(item.orderId);
    const status = statusByOrderId.get(orderId);
    if (
      status !== "pending_confirmation" &&
      !COMMITTED_STATUSES.has(status as OrderStatus)
    ) {
      continue;
    }

    const flavorId = item.flavorId ? String(item.flavorId) : undefined;
    const flavorName = String(item.flavorName ?? "Desconocido");
    const key = flavorId ?? `name:${flavorName}`;
    const entry = entries.get(key) ?? {
      flavorId,
      flavorName,
      pendingOrders: 0,
      pendingUnits: 0,
      pendingLiters: 0,
      committedOrders: 0,
      committedUnits: 0,
      committedLiters: 0,
      pendingOrderIds: new Set<string>(),
      committedOrderIds: new Set<string>(),
    };
    const quantity = Number(item.quantity ?? 0);
    const liters = quantity * (item.presentation === "1 litro" ? 1 : 0.5);

    if (status === "pending_confirmation") {
      entry.pendingOrderIds.add(orderId);
      entry.pendingUnits += quantity;
      entry.pendingLiters += liters;
    } else {
      entry.committedOrderIds.add(orderId);
      entry.committedUnits += quantity;
      entry.committedLiters += liters;
    }

    entries.set(key, entry);
  }

  return Array.from(entries.values())
    .map(({ pendingOrderIds, committedOrderIds, ...entry }) => ({
      ...entry,
      pendingOrders: pendingOrderIds.size,
      committedOrders: committedOrderIds.size,
    }))
    .sort((a, b) =>
      a.flavorName.localeCompare(b.flavorName, "es", { sensitivity: "base" }),
    );
}

export async function getAdminProductionDemand(
  date = todayInMexicoCity(),
): Promise<ProductionDemandResponse> {
  const startDate = parseDateOnlyToRangeBoundary(date, "start");
  const endDate = parseDateOnlyToRangeBoundary(date, "end");
  if (!startDate || !endDate) {
    throw new Error("Invalid production date");
  }

  await connectToDatabase();

  const orders = await OrderModel.find({
    createdAt: { $gte: startDate, $lte: endDate },
    status: {
      $in: ["pending_confirmation", "confirmed", "paid", "delivered"],
    },
  })
    .select({ _id: 1, status: 1 })
    .lean();
  const orderIds = orders.map((order) => order._id);
  const items =
    orderIds.length === 0
      ? []
      : await OrderItemModel.find({ orderId: { $in: orderIds } })
          .select({
            orderId: 1,
            flavorId: 1,
            flavorName: 1,
            presentation: 1,
            quantity: 1,
          })
          .lean();

  return {
    date,
    entries: summarizeProductionDemand(orders as DemandOrder[], items),
  };
}

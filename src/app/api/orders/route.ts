import mongoose, { type ClientSession } from "mongoose";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { sendOrderPendingEmail } from "@/lib/email/order-notifications";
import { getAvailablePresentations, resolveFlavorPrice } from "@/lib/pricing";
import {
  type IncomingOrderItem,
  PRESENTATION_OPTIONS,
  type PresentationOption,
  type UnavailableOrderItem,
} from "@/lib/types";
import { FlavorModel } from "@/models/Flavor";
import { LotModel } from "@/models/Lot";
import { OrderModel } from "@/models/Order";
import { OrderItemModel } from "@/models/OrderItem";

type NormalizedItem = {
  flavorId: string;
  flavorName: string;
  presentation: PresentationOption;
  quantity: number;
};

function normalizeItems(items: IncomingOrderItem[]) {
  const grouped = new Map<string, NormalizedItem>();
  for (const item of items) {
    const flavorId = String(item.flavorId ?? "");
    if (!mongoose.Types.ObjectId.isValid(flavorId)) {
      throw new InvalidInputError("Invalid flavor");
    }
    const quantity = item.quantity != null ? Number(item.quantity) : 1;
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new InvalidInputError(`Invalid quantity for "${item.flavorName}"`);
    }
    if (
      !PRESENTATION_OPTIONS.includes(item.presentation as PresentationOption)
    ) {
      throw new InvalidInputError(
        `Invalid presentation for "${item.flavorName}"`,
      );
    }
    const presentation = item.presentation as PresentationOption;
    const key = `${flavorId}:${presentation}`;
    const current = grouped.get(key);
    grouped.set(key, {
      flavorId,
      flavorName: String(item.flavorName || "Este sabor"),
      presentation,
      quantity: (current?.quantity ?? 0) + quantity,
    });
  }
  return [...grouped.values()];
}

function inventoryField(presentation: PresentationOption) {
  return presentation === "1/2 litro" ? "halfLiter" : "liter";
}

async function reserveLots(
  flavorId: string,
  presentation: PresentationOption,
  quantity: number,
  lots: Array<Record<string, unknown>>,
  session: ClientSession,
) {
  let needed = quantity;
  const field = inventoryField(presentation);
  const allocations: Array<{ lotId: unknown; quantity: number }> = [];

  for (const lot of lots) {
    if (String(lot.flavorId) !== flavorId || needed === 0) continue;
    const available = Number(
      (lot.remaining as Record<string, unknown> | undefined)?.[field] ?? 0,
    );
    const reserved = Math.min(available, needed);
    if (reserved === 0) continue;

    const result = await LotModel.updateOne(
      { _id: lot._id, [`remaining.${field}`]: { $gte: reserved } },
      { $inc: { [`remaining.${field}`]: -reserved } },
      { session },
    );
    if (result.modifiedCount !== 1) {
      throw new Error("Inventory changed during checkout");
    }
    allocations.push({ lotId: lot._id, quantity: reserved });
    needed -= reserved;
  }
  if (needed > 0) throw new Error("Inventory changed during checkout");
  return allocations;
}

export async function POST(request: Request) {
  let session: ClientSession | null = null;
  try {
    const database = await connectToDatabase();
    const payload = await request.json();
    const rawItems = (payload.items ?? []) as IncomingOrderItem[];
    const customerEmail = String(payload.customerEmail ?? "")
      .trim()
      .toLowerCase();
    const customerPhone =
      typeof payload.customerPhone === "string"
        ? payload.customerPhone.trim()
        : "";
    const customerName = String(payload.customerName ?? "").trim();

    if (!customerName) {
      return NextResponse.json(
        { message: "Customer name is required" },
        { status: 400 },
      );
    }
    if (!customerEmail) {
      return NextResponse.json(
        { message: "Customer email is required" },
        { status: 400 },
      );
    }
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return NextResponse.json(
        { message: "Order requires at least one item" },
        { status: 400 },
      );
    }

    const items = normalizeItems(rawItems);
    const orderSession = await database.startSession();
    session = orderSession;
    let savedOrder: Record<string, unknown> | null = null;

    await orderSession.withTransaction(async () => {
      const flavorIds = [...new Set(items.map((item) => item.flavorId))];
      const flavors = await FlavorModel.find(
        {
          _id: { $in: flavorIds },
          exists: true,
          isVisibleOnSite: { $ne: false },
          isArchived: { $ne: true },
        },
        null,
        { session: orderSession },
      ).lean();
      const flavorsById = new Map(
        flavors.map((flavor) => [String(flavor._id), flavor]),
      );
      const managedFlavorIds = flavors
        .filter((flavor) => flavor.inventoryManaged)
        .map((flavor) => flavor._id);
      const lots = managedFlavorIds.length
        ? await LotModel.find({ flavorId: { $in: managedFlavorIds } }, null, {
            session: orderSession,
          })
            .sort({ createdAt: 1, _id: 1 })
            .lean()
        : [];

      const unavailableItems: UnavailableOrderItem[] = [];
      for (const item of items) {
        const flavor = flavorsById.get(item.flavorId);
        if (!flavor) {
          unavailableItems.push(item);
          continue;
        }
        if (flavor.inventoryManaged) {
          const field = inventoryField(item.presentation);
          const available = lots.reduce((total, lot) => {
            if (String(lot.flavorId) !== item.flavorId) return total;
            return (
              total +
              Number(
                (lot.remaining as Record<string, unknown> | undefined)?.[
                  field
                ] ?? 0,
              )
            );
          }, 0);
          if (available < item.quantity) unavailableItems.push(item);
        } else if (
          !getAvailablePresentations(
            flavor.availablePresentations as PresentationOption[] | undefined,
          ).includes(item.presentation)
        ) {
          unavailableItems.push({ ...item, flavorName: String(flavor.name) });
        }
      }

      if (unavailableItems.length) {
        throw new UnavailableFlavorError(
          "Algunos sabores ya no tienen disponibilidad suficiente.",
          unavailableItems,
        );
      }

      const orderItemsPayload = [];
      for (const item of items) {
        const flavor = flavorsById.get(item.flavorId);
        if (!flavor) continue;
        const lotAllocations = flavor.inventoryManaged
          ? await reserveLots(
              item.flavorId,
              item.presentation,
              item.quantity,
              lots as Array<Record<string, unknown>>,
              orderSession,
            )
          : [];
        const unitPrice = resolveFlavorPrice(flavor.price, item.presentation);
        orderItemsPayload.push({
          flavorId: flavor._id,
          flavorName: flavor.name,
          presentation: item.presentation,
          quantity: item.quantity,
          unitPrice,
          subtotal: item.quantity * unitPrice,
          lotAllocations,
        });
      }

      const totalPrice = orderItemsPayload.reduce(
        (sum, item) => sum + item.subtotal,
        0,
      );
      const itemCount = orderItemsPayload.reduce(
        (sum, item) => sum + item.quantity,
        0,
      );
      const [order] = await OrderModel.create(
        [
          {
            customerName,
            customerEmail,
            ...(customerPhone ? { customerPhone } : {}),
            notes: payload.notes,
            status: "pending_confirmation",
            currency: "MXN",
            totalPrice,
            itemCount,
          },
        ],
        { session: orderSession },
      );
      const savedItems = await OrderItemModel.insertMany(
        orderItemsPayload.map((item) => ({ ...item, orderId: order._id })),
        { session: orderSession },
      );
      savedOrder = {
        ...order.toObject(),
        items: savedItems.map((item) => item.toObject()),
      };
    });

    if (!savedOrder) throw new Error("Order could not be created");
    const completedOrder = savedOrder as Parameters<
      typeof sendOrderPendingEmail
    >[0];
    try {
      await sendOrderPendingEmail(completedOrder);
    } catch (emailError) {
      console.error("[orders:POST] Failed to send email notification", {
        orderId: completedOrder._id,
        error: emailError instanceof Error ? emailError.message : emailError,
      });
    }
    return NextResponse.json(completedOrder, { status: 201 });
  } catch (error) {
    if (error instanceof InvalidInputError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    if (error instanceof UnavailableFlavorError) {
      return NextResponse.json(
        { message: error.message, unavailableItems: error.unavailableItems },
        { status: 409 },
      );
    }
    console.error("[orders:POST]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  } finally {
    await session?.endSession();
  }
}

class UnavailableFlavorError extends Error {
  constructor(
    message: string,
    readonly unavailableItems: UnavailableOrderItem[],
  ) {
    super(message);
    this.name = "UnavailableFlavorError";
  }
}

class InvalidInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidInputError";
  }
}

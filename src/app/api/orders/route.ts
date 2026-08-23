import { isValidObjectId } from "mongoose";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { sendOrderPendingEmail } from "@/lib/email/order-notifications";
import { resolveFlavorPrice } from "@/lib/pricing";
import {
  type IncomingOrderItem,
  PRESENTATION_OPTIONS,
  type PresentationOption,
} from "@/lib/types";
import { FlavorModel } from "@/models/Flavor";
import { OrderModel } from "@/models/Order";
import { OrderItemModel } from "@/models/OrderItem";

export async function POST(request: Request) {
  try {
    await connectToDatabase();

    const payload = await request.json();
    const items = (payload.items ?? []) as IncomingOrderItem[];
    const customerEmail = String(payload.customerEmail ?? "")
      .trim()
      .toLowerCase();
    const customerPhone =
      typeof payload.customerPhone === "string"
        ? payload.customerPhone.trim()
        : "";
    const customerNameFromEmail = customerEmail.split("@")[0] ?? "";
    const customerName =
      String(payload.customerName ?? "").trim() || customerNameFromEmail;

    if (!customerEmail) {
      return NextResponse.json(
        { message: "Customer email is required" },
        { status: 400 },
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { message: "Order requires at least one item" },
        { status: 400 },
      );
    }

    const requestedItems = items.map((item) => {
      const quantity = item.quantity != null ? Number(item.quantity) : 1;
      const flavorId = String(item.flavorId ?? "").trim();
      const flavorName = String(item.flavorName ?? "").trim();
      const presentation = String(item.presentation ?? "");

      if (flavorId && !isValidObjectId(flavorId)) {
        throw new InvalidInputError(
          `Invalid flavorId for "${flavorName || "item"}"`,
        );
      }
      if (!flavorId && !flavorName) {
        throw new InvalidInputError("Order item requires a flavor");
      }
      if (!PRESENTATION_OPTIONS.includes(presentation as PresentationOption)) {
        throw new InvalidInputError(
          `Invalid presentation for "${flavorName || flavorId}"`,
        );
      }
      if (!Number.isFinite(quantity) || quantity < 1) {
        throw new InvalidInputError(
          `Invalid quantity for "${flavorName || flavorId}"`,
        );
      }

      return {
        flavorId,
        flavorName,
        presentation: presentation as PresentationOption,
        quantity,
      };
    });

    const flavorIds = requestedItems
      .map((item) => item.flavorId)
      .filter(Boolean);
    const legacyFlavorNames = requestedItems
      .filter((item) => !item.flavorId)
      .map((item) => item.flavorName);
    const flavorLookup = [
      ...(flavorIds.length > 0 ? [{ _id: { $in: flavorIds } }] : []),
      ...(legacyFlavorNames.length > 0
        ? [{ name: { $in: legacyFlavorNames } }]
        : []),
    ];
    const flavors = await FlavorModel.find({
      exists: true,
      isArchived: { $ne: true },
      $or: flavorLookup,
    }).lean();
    const flavorsById = new Map(
      flavors.map((flavor) => [String(flavor._id), flavor]),
    );
    const flavorsByName = new Map(
      flavors.map((flavor) => [flavor.name, flavor]),
    );

    const orderItemsPayload = requestedItems.map((item) => {
      const flavor = item.flavorId
        ? flavorsById.get(item.flavorId)
        : flavorsByName.get(item.flavorName);
      if (!flavor) {
        throw new InvalidInputError(
          `Flavor not found for "${item.flavorName || item.flavorId}"`,
        );
      }

      const unitPrice = resolveFlavorPrice(flavor.price, item.presentation);
      return {
        flavorId: flavor._id,
        flavorName: flavor.name,
        presentation: item.presentation,
        quantity: item.quantity,
        unitPrice,
        subtotal: item.quantity * unitPrice,
      };
    });

    const totalPrice = orderItemsPayload.reduce(
      (sum, item) => sum + item.subtotal,
      0,
    );
    const itemCount = orderItemsPayload.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );

    const order = await OrderModel.create({
      customerName,
      customerEmail,
      ...(customerPhone ? { customerPhone } : {}),
      notes: payload.notes,
      status: "pending_confirmation",
      currency: "MXN",
      totalPrice,
      itemCount,
    });

    let savedItems: Array<{ toObject: () => unknown }> = [];
    try {
      savedItems = await OrderItemModel.insertMany(
        orderItemsPayload.map((item) => ({
          ...item,
          orderId: order._id,
        })),
      );
    } catch (itemsError) {
      await OrderModel.findByIdAndDelete(order._id);
      throw itemsError;
    }

    const orderWithItems = {
      ...order.toObject(),
      items: savedItems.map((item) => item.toObject()),
    };

    try {
      await sendOrderPendingEmail(orderWithItems);
    } catch (emailError) {
      console.error("[orders:POST] Failed to send email notification", {
        orderId: order._id,
        error: emailError instanceof Error ? emailError.message : emailError,
      });
    }

    return NextResponse.json(orderWithItems, { status: 201 });
  } catch (error) {
    if (error instanceof InvalidInputError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    console.error("[orders:POST]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

class InvalidInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidInputError";
  }
}

import mongoose from "mongoose";
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

    const flavorIds = items.map((item) => String(item.flavorId ?? ""));
    if (flavorIds.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
      throw new InvalidInputError("Invalid flavor");
    }

    const flavors = await FlavorModel.find({
      _id: { $in: [...new Set(flavorIds)] },
      exists: true,
      isVisibleOnSite: true,
      isArchived: { $ne: true },
    }).lean();
    const flavorsById = new Map(
      flavors.map((flavor) => [String(flavor._id), flavor]),
    );

    const orderItemsPayload = items.map((item) => {
      const quantity = item.quantity != null ? Number(item.quantity) : 1;
      if (!Number.isInteger(quantity) || quantity < 1) {
        throw new InvalidInputError(
          `Invalid quantity for "${item.flavorName}"`,
        );
      }

      if (
        !PRESENTATION_OPTIONS.includes(item.presentation as PresentationOption)
      ) {
        throw new InvalidInputError(
          `Invalid presentation for "${item.flavorName}"`,
        );
      }

      const flavor = flavorsById.get(String(item.flavorId));
      if (!flavor) {
        throw new UnavailableFlavorError(
          `${item.flavorName || "Este sabor"} ya no está disponible. Retíralo del carrito para continuar.`,
        );
      }

      const presentation = item.presentation as PresentationOption;
      const unitPrice = resolveFlavorPrice(flavor.price, presentation);
      return {
        flavorId: flavor._id,
        flavorName: flavor.name,
        presentation,
        quantity,
        unitPrice,
        subtotal: quantity * unitPrice,
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
    if (error instanceof UnavailableFlavorError) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }
    console.error("[orders:POST]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

class UnavailableFlavorError extends Error {
  constructor(message: string) {
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

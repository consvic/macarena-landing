import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { sendOrderPendingEmail } from "@/lib/email/order-notifications";
import { OrderModel } from "@/models/Order";
import { OrderItemModel } from "@/models/OrderItem";

type IncomingOrderItem = {
  flavorId?: string;
  flavorName: string;
  presentation: string;
  quantity: number;
  unitPrice: number;
};

export async function POST(request: Request) {
  try {
    await connectToDatabase();

    const payload = await request.json();
    const items = (payload.items ?? []) as IncomingOrderItem[];
    const customerEmail = String(payload.customerEmail ?? "")
      .trim()
      .toLowerCase();
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

    const orderItemsPayload = items.map((item) => {
      const quantity = Number(item.quantity || 1);
      const unitPrice = Number(item.unitPrice || 0);
      return {
        flavorId: item.flavorId,
        flavorName: item.flavorName,
        presentation: item.presentation,
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
      customerPhone: payload.customerPhone,
      notes: payload.notes,
      status: "pending_confirmation",
      currency: "MXN",
      totalPrice,
      itemCount,
    });

    const savedItems = await OrderItemModel.insertMany(
      orderItemsPayload.map((item) => ({
        ...item,
        orderId: order._id,
      })),
    );

    const orderWithItems = {
      ...order.toObject(),
      items: savedItems.map((item) => item.toObject()),
    };

    try {
      await sendOrderPendingEmail(orderWithItems);
    } catch (emailError) {
      console.error("[orders:POST] Failed to send email notification", {
        orderId: order._id,
        error:
          emailError instanceof Error ? emailError.message : emailError,
      });
    }

    return NextResponse.json(orderWithItems, { status: 201 });
  } catch (error) {
    console.error("[orders:POST]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

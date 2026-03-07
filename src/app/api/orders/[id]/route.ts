import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import {
  sendOrderConfirmedEmail,
  sendOrderPendingEmail,
} from "@/lib/email/order-notifications";
import { OrderModel } from "@/models/Order";
import { OrderItemModel } from "@/models/OrderItem";

type IncomingOrderItem = {
  flavorId?: string;
  flavorName: string;
  presentation: string;
  quantity: number;
  unitPrice: number;
};

function invalidIdResponse() {
  return NextResponse.json({ message: "Invalid order id" }, { status: 400 });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return invalidIdResponse();
  }

  await connectToDatabase();

  const order = await OrderModel.findById(id).lean();
  if (!order) {
    return NextResponse.json({ message: "Order not found" }, { status: 404 });
  }

  const items = await OrderItemModel.find({ orderId: order._id }).lean();

  return NextResponse.json({ ...order, items });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return invalidIdResponse();
  }

  await connectToDatabase();

  const previousOrder = await OrderModel.findById(id).lean();
  if (!previousOrder) {
    return NextResponse.json({ message: "Order not found" }, { status: 404 });
  }

  const payload = await request.json();
  const incomingItems = payload.items as IncomingOrderItem[] | undefined;

  let computedPayload = { ...payload };
  delete (computedPayload as Record<string, unknown>).items;

  if (incomingItems) {
    const normalizedItems = incomingItems.map((item) => {
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

    const totalPrice = normalizedItems.reduce(
      (sum, item) => sum + item.subtotal,
      0,
    );
    const itemCount = normalizedItems.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );

    computedPayload = {
      ...computedPayload,
      totalPrice,
      itemCount,
    };

    await OrderItemModel.deleteMany({ orderId: id });
    await OrderItemModel.insertMany(
      normalizedItems.map((item) => ({ ...item, orderId: id })),
    );
  }

  if (computedPayload.status === "confirmed") {
    computedPayload = {
      ...computedPayload,
      confirmedAt: new Date(),
    };
  }

  const order = await OrderModel.findByIdAndUpdate(id, computedPayload, {
    new: true,
    runValidators: true,
  }).lean();

  if (!order) {
    return NextResponse.json({ message: "Order not found" }, { status: 404 });
  }

  const items = await OrderItemModel.find({ orderId: order._id }).lean();
  const orderWithItems = { ...order, items };

  const statusChanged = previousOrder.status !== order.status;
  if (statusChanged && order.status === "pending_confirmation") {
    await sendOrderPendingEmail(orderWithItems);
  }

  if (statusChanged && order.status === "confirmed") {
    await sendOrderConfirmedEmail(orderWithItems);
  }

  return NextResponse.json(orderWithItems);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return invalidIdResponse();
  }

  await connectToDatabase();

  const deletedOrder = await OrderModel.findByIdAndDelete(id).lean();

  if (!deletedOrder) {
    return NextResponse.json({ message: "Order not found" }, { status: 404 });
  }

  await OrderItemModel.deleteMany({ orderId: id });
  return new NextResponse(null, { status: 204 });
}

import { render } from "@react-email/render";
import { Resend } from "resend";
import type { OrderEmailPayload } from "@/lib/email/types";
import OrderConfirmedEmail from "../../../emails/OrderConfirmedEmail";
import OrderPendingEmail from "../../../emails/OrderPendingEmail";

import type { OrderStatus, PresentationOption } from "@/lib/types";

type OrderWithItems = {
  _id: unknown;
  customerName: string;
  customerEmail: string;
  status: OrderStatus;
  totalPrice: number;
  currency: string;
  items: Array<{
    flavorName: string;
    presentation: PresentationOption;
    quantity: number;
    subtotal: number;
  }>;
  createdAt?: unknown;
};

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL;

function toEmailPayload(order: OrderWithItems): OrderEmailPayload {
  return {
    _id: String(order._id),
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    status: order.status,
    totalPrice: order.totalPrice,
    currency: order.currency,
    items: order.items,
    createdAt: order.createdAt ? String(order.createdAt) : undefined,
  };
}

async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!RESEND_API_KEY || !RESEND_FROM_EMAIL) {
    console.warn(
      "[email] Skipping email send: RESEND_API_KEY or RESEND_FROM_EMAIL is not configured.",
      { to, subject },
    );
    return;
  }

  const resend = new Resend(RESEND_API_KEY);
  await resend.emails.send({
    from: RESEND_FROM_EMAIL,
    to,
    subject,
    html,
  });
}

export async function sendOrderPendingEmail(order: OrderWithItems) {
  const payload = toEmailPayload(order);
  const html = await render(OrderPendingEmail({ order: payload }));

  await sendEmail({
    to: payload.customerEmail,
    subject: "Tu pedido esta pendiente de confirmacion",
    html,
  });
}

export async function sendOrderConfirmedEmail(order: OrderWithItems) {
  const payload = toEmailPayload(order);
  const html = await render(OrderConfirmedEmail({ order: payload }));

  await sendEmail({
    to: payload.customerEmail,
    subject: "Tu pedido fue confirmado",
    html,
  });
}

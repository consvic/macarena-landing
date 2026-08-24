import { after, NextResponse } from "next/server";
import {
  getAuthorizedAdminUserFromRequest,
  unauthorizedJsonResponse,
} from "@/lib/admin/auth";
import { updateAdminOrderStatus } from "@/lib/admin/services";
import { sendOrderConfirmedEmail } from "@/lib/email/order-notifications";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/types";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const adminUser = await getAuthorizedAdminUserFromRequest(request);
  if (!adminUser) {
    return unauthorizedJsonResponse();
  }

  try {
    const { id } = await params;
    const payload = (await request.json()) as { status?: string };
    const status = String(payload.status ?? "") as OrderStatus;

    if (!ORDER_STATUSES.includes(status)) {
      return NextResponse.json({ message: "Invalid status" }, { status: 400 });
    }

    const { order, previousStatus } = await updateAdminOrderStatus(
      id,
      status,
      adminUser,
    );

    if (status === "confirmed" && previousStatus !== "confirmed") {
      after(async () => {
        try {
          await sendOrderConfirmedEmail(order);
        } catch (emailError) {
          console.error(
            "[admin:orders:status:PATCH] Failed to send confirmation email",
            {
              orderId: order._id,
              error:
                emailError instanceof Error ? emailError.message : emailError,
            },
          );
        }
      });
    }

    return NextResponse.json(order);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    const statusCode =
      message === "Order not found"
        ? 404
        : message === "Cancelled order is final"
          ? 409
          : message.includes("Invalid")
            ? 400
            : 500;

    if (statusCode === 500) {
      console.error("[admin:orders:status:PATCH]", error);
    }

    return NextResponse.json({ message }, { status: statusCode });
  }
}

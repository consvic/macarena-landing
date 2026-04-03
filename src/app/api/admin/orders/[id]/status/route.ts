import { NextResponse } from "next/server";
import {
  getAuthorizedAdminUserFromRequest,
  unauthorizedJsonResponse,
} from "@/lib/admin/auth";
import { updateAdminOrderStatus } from "@/lib/admin/services";
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

    const updated = await updateAdminOrderStatus(id, status, adminUser);
    return NextResponse.json(updated);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    const statusCode =
      message === "Order not found"
        ? 404
        : message.includes("Invalid")
          ? 400
          : 500;

    if (statusCode === 500) {
      console.error("[admin:orders:status:PATCH]", error);
    }

    return NextResponse.json({ message }, { status: statusCode });
  }
}

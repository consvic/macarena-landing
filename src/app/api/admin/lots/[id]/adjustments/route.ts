import { NextResponse } from "next/server";
import {
  getAuthorizedAdminUserFromRequest,
  unauthorizedJsonResponse,
} from "@/lib/admin/auth";
import { adjustAdminLot } from "@/lib/admin/lots";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const adminUser = await getAuthorizedAdminUserFromRequest(request);
  if (!adminUser) return unauthorizedJsonResponse();

  try {
    const { id } = await params;
    const adjusted = await adjustAdminLot(id, await request.json(), adminUser);
    return NextResponse.json(adjusted);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    const status =
      message === "Lot not found"
        ? 404
        : message === "Insufficient lot inventory"
          ? 409
          : message.includes("Invalid") ||
              message.includes("integer") ||
              message.includes("required")
            ? 400
            : 500;
    return NextResponse.json({ message }, { status });
  }
}

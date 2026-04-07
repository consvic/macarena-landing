import { NextResponse } from "next/server";
import {
  getAuthorizedAdminUserFromRequest,
  unauthorizedJsonResponse,
} from "@/lib/admin/auth";
import { updateAdminFlavor } from "@/lib/admin/services";

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
    const payload = await request.json();
    const updated = await updateAdminFlavor(id, payload, adminUser);

    return NextResponse.json(updated);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    const lowered = message.toLowerCase();
    const status =
      message === "Flavor not found"
        ? 404
        : lowered.includes("invalid") ||
            lowered.includes("required") ||
            lowered.includes("changes")
          ? 400
          : 500;

    if (status === 500) {
      console.error("[admin:flavors:id:PATCH]", error);
    }

    return NextResponse.json({ message }, { status });
  }
}

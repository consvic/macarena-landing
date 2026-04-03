import { NextResponse } from "next/server";
import {
  getAuthorizedAdminUserFromRequest,
  unauthorizedJsonResponse,
} from "@/lib/admin/auth";
import { setAdminFlavorArchived } from "@/lib/admin/services";

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
    const payload = (await request.json()) as { isArchived?: boolean };

    if (typeof payload.isArchived !== "boolean") {
      return NextResponse.json(
        { message: "isArchived must be boolean" },
        { status: 400 },
      );
    }

    const updated = await setAdminFlavorArchived(
      id,
      payload.isArchived,
      adminUser,
    );

    return NextResponse.json(updated);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    const status =
      message === "Flavor not found"
        ? 404
        : message.includes("Invalid")
          ? 400
          : 500;

    if (status === 500) {
      console.error("[admin:flavors:archive:PATCH]", error);
    }

    return NextResponse.json({ message }, { status });
  }
}

import { NextResponse } from "next/server";
import {
  getAuthorizedAdminUserFromRequest,
  unauthorizedJsonResponse,
} from "@/lib/admin/auth";
import { setAdminFlavorVisibility } from "@/lib/admin/services";

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
    const payload = (await request.json()) as { isVisibleOnSite?: boolean };

    if (typeof payload.isVisibleOnSite !== "boolean") {
      return NextResponse.json(
        { message: "isVisibleOnSite must be boolean" },
        { status: 400 },
      );
    }

    const updated = await setAdminFlavorVisibility(
      id,
      payload.isVisibleOnSite,
      adminUser,
    );

    return NextResponse.json(updated);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    const status =
      message === "Flavor not found"
        ? 404
        : message.includes("Invalid") || message.includes("cannot")
          ? 400
          : 500;

    if (status === 500) {
      console.error("[admin:flavors:visibility:PATCH]", error);
    }

    return NextResponse.json({ message }, { status });
  }
}

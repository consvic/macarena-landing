import { NextResponse } from "next/server";
import {
  getAuthorizedAdminUserFromRequest,
  unauthorizedJsonResponse,
} from "@/lib/admin/auth";
import { createAdminFlavor, listAdminFlavors } from "@/lib/admin/services";

export async function GET(request: Request) {
  const adminUser = await getAuthorizedAdminUserFromRequest(request);
  if (!adminUser) {
    return unauthorizedJsonResponse();
  }

  try {
    const flavors = await listAdminFlavors();
    return NextResponse.json(flavors);
  } catch (error) {
    console.error("[admin:flavors:GET]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const adminUser = await getAuthorizedAdminUserFromRequest(request);
  if (!adminUser) {
    return unauthorizedJsonResponse();
  }

  try {
    const payload = await request.json();
    const created = await createAdminFlavor(payload, adminUser);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    const status =
      message.toLowerCase().includes("required") || message.includes("invalid")
        ? 400
        : 500;

    if (status === 500) {
      console.error("[admin:flavors:POST]", error);
    }

    return NextResponse.json({ message }, { status });
  }
}

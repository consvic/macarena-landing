import { NextResponse } from "next/server";
import {
  getAuthorizedAdminUserFromRequest,
  unauthorizedJsonResponse,
} from "@/lib/admin/auth";
import { createAdminLot, listAdminLots } from "@/lib/admin/lots";

function errorResponse(error: unknown) {
  const message =
    error instanceof Error ? error.message : "Internal server error";
  const status = message.includes("not found")
    ? 404
    : message.includes("Invalid") ||
        message.includes("integer") ||
        message.includes("negative") ||
        message.includes("required")
      ? 400
      : 500;
  return NextResponse.json({ message }, { status });
}

export async function GET(request: Request) {
  const adminUser = await getAuthorizedAdminUserFromRequest(request);
  if (!adminUser) return unauthorizedJsonResponse();

  try {
    const flavorId = new URL(request.url).searchParams.get("flavorId") ?? "";
    return NextResponse.json(await listAdminLots(flavorId));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  const adminUser = await getAuthorizedAdminUserFromRequest(request);
  if (!adminUser) return unauthorizedJsonResponse();

  try {
    const payload = await request.json();
    const created = await createAdminLot(
      String(payload.flavorId ?? ""),
      payload,
      adminUser,
    );
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

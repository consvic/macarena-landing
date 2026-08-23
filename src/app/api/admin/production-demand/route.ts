import { NextResponse } from "next/server";
import {
  getAuthorizedAdminUserFromRequest,
  unauthorizedJsonResponse,
} from "@/lib/admin/auth";
import { getAdminProductionDemand } from "@/lib/admin/production-demand";

export async function GET(request: Request) {
  const adminUser = await getAuthorizedAdminUserFromRequest(request);
  if (!adminUser) {
    return unauthorizedJsonResponse();
  }

  try {
    const date = new URL(request.url).searchParams.get("date") ?? undefined;
    return NextResponse.json(await getAdminProductionDemand(date));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    const status = message.includes("Invalid") ? 400 : 500;
    if (status === 500) {
      console.error("[admin:production-demand:GET]", error);
    }
    return NextResponse.json({ message }, { status });
  }
}

import { NextResponse } from "next/server";
import {
  getAuthorizedAdminUserFromRequest,
  unauthorizedJsonResponse,
} from "@/lib/admin/auth";
import { getAdminStats } from "@/lib/admin/services";

export async function GET(request: Request) {
  const adminUser = await getAuthorizedAdminUserFromRequest(request);
  if (!adminUser) {
    return unauthorizedJsonResponse();
  }

  try {
    const { searchParams } = new URL(request.url);

    const stats = await getAdminStats({
      dateFrom: searchParams.get("dateFrom") ?? undefined,
      dateTo: searchParams.get("dateTo") ?? undefined,
      topN: Number(searchParams.get("topN") ?? 10),
    });

    return NextResponse.json(stats);
  } catch (error) {
    console.error("[admin:stats:GET]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import {
  getAuthorizedAdminUserFromRequest,
  unauthorizedJsonResponse,
} from "@/lib/admin/auth";
import { listAdminOrders } from "@/lib/admin/services";

export async function GET(request: Request) {
  const adminUser = await getAuthorizedAdminUserFromRequest(request);
  if (!adminUser) {
    return unauthorizedJsonResponse();
  }

  try {
    const { searchParams } = new URL(request.url);
    const result = await listAdminOrders({
      page: Number(searchParams.get("page") ?? 1),
      limit: Number(searchParams.get("limit") ?? 20),
      search: searchParams.get("search") ?? "",
      status: searchParams.get("status") ?? "",
      dateFrom: searchParams.get("dateFrom") ?? "",
      dateTo: searchParams.get("dateTo") ?? "",
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[admin:orders:GET]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

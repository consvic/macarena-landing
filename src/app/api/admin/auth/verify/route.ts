import { NextResponse } from "next/server";
import {
  getAuthorizedAdminUserFromRequest,
  unauthorizedTextResponse,
} from "@/lib/admin/auth";

export async function GET(request: Request) {
  const adminUser = await getAuthorizedAdminUserFromRequest(request);
  if (!adminUser) {
    return unauthorizedTextResponse();
  }

  return NextResponse.json({ email: adminUser });
}

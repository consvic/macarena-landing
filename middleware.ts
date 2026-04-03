import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  getAuthorizedAdminUser,
  getUnauthorizedHeaders,
} from "@/lib/admin/auth";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProtectedPath =
    pathname.startsWith("/admin") || pathname.startsWith("/api/admin");

  if (!isProtectedPath) {
    return NextResponse.next();
  }

  const adminUser = await getAuthorizedAdminUser(
    request.headers.get("authorization"),
  );

  if (!adminUser) {
    return new NextResponse("Unauthorized", {
      status: 401,
      headers: getUnauthorizedHeaders(),
    });
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-admin-user", adminUser);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

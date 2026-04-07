import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  getUnauthorizedHeaders,
  parseBasicAuthHeader,
} from "@/lib/admin/basic-auth";
import { ADMIN_SESSION_COOKIE_NAME } from "@/lib/admin/constants";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAdminPagePath = pathname.startsWith("/admin");
  const isAdminApiPath = pathname.startsWith("/api/admin");
  const isProtectedPath = isAdminPagePath || isAdminApiPath;

  if (!isProtectedPath) {
    return NextResponse.next();
  }

  const isPublicAdminAuthPath =
    pathname === "/admin/login" || pathname.startsWith("/api/admin/auth/");

  if (isPublicAdminAuthPath) {
    return NextResponse.next();
  }

  const authorization = request.headers.get("authorization");
  const cookieHeader = request.headers.get("cookie");
  const hasBasicCredentials = Boolean(parseBasicAuthHeader(authorization));
  const hasSessionCookie = Boolean(
    cookieHeader?.includes(`${ADMIN_SESSION_COOKIE_NAME}=`),
  );

  if (isAdminPagePath && !hasSessionCookie) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    loginUrl.searchParams.set(
      "next",
      `${pathname}${request.nextUrl.search || ""}`,
    );
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminApiPath && !hasBasicCredentials && !hasSessionCookie) {
    return new NextResponse("Unauthorized", {
      status: 401,
      headers: getUnauthorizedHeaders(),
    });
  }

  const verificationUrl = request.nextUrl.clone();
  verificationUrl.pathname = "/api/admin/auth/verify";
  verificationUrl.search = "";

  const verificationHeaders = new Headers();
  if (isAdminApiPath && authorization) {
    verificationHeaders.set("authorization", authorization);
  }
  if (cookieHeader) {
    verificationHeaders.set("cookie", cookieHeader);
  }

  const verificationResponse = await fetch(verificationUrl, {
    method: "GET",
    headers: verificationHeaders,
    cache: "no-store",
  });

  if (!verificationResponse.ok) {
    if (isAdminPagePath) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/admin/login";
      loginUrl.searchParams.set(
        "next",
        `${pathname}${request.nextUrl.search || ""}`,
      );
      return NextResponse.redirect(loginUrl);
    }

    return new NextResponse("Unauthorized", {
      status: 401,
      headers: getUnauthorizedHeaders(),
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin", "/api/admin/:path*"],
};

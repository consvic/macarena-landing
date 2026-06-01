import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  getUnauthorizedHeaders,
  parseBasicAuthHeader,
} from "@/lib/admin/basic-auth";
import { ADMIN_SESSION_COOKIE_NAME } from "@/lib/admin/constants";
import {
  checkRateLimit,
  createRateLimitResponse,
  getClientIdentifier,
  type RateLimitPolicy,
} from "@/lib/rate-limit";

const PUBLIC_RATE_LIMIT_POLICIES = {
  flavorReads: {
    id: "public:flavor-reads",
    limit: 120,
    windowMs: 60 * 1000,
  },
  orderCreate: {
    id: "public:order-create",
    limit: 10,
    windowMs: 60 * 1000,
  },
  adminLogin: {
    id: "public:admin-login",
    limit: 5,
    windowMs: 15 * 60 * 1000,
  },
  adminLogout: {
    id: "public:admin-logout",
    limit: 60,
    windowMs: 60 * 1000,
  },
} satisfies Record<string, RateLimitPolicy>;

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const publicRateLimitPolicy = getPublicRateLimitPolicy(
    pathname,
    request.method,
  );

  if (publicRateLimitPolicy) {
    const rateLimitResult = checkRateLimit(
      publicRateLimitPolicy,
      getClientIdentifier(request.headers),
    );

    if (rateLimitResult.limited) {
      return createRateLimitResponse(rateLimitResult);
    }
  }

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
  matcher: ["/admin", "/admin/:path*", "/api", "/api/:path*"],
};

function getPublicRateLimitPolicy(pathname: string, method: string) {
  const normalizedMethod = method.toUpperCase();

  if (
    normalizedMethod === "GET" &&
    /^\/api\/flavors(?:\/[^/]+)?\/?$/.test(pathname)
  ) {
    return PUBLIC_RATE_LIMIT_POLICIES.flavorReads;
  }

  if (normalizedMethod === "POST" && pathname === "/api/orders") {
    return PUBLIC_RATE_LIMIT_POLICIES.orderCreate;
  }

  if (normalizedMethod === "POST" && pathname === "/api/admin/auth/login") {
    return PUBLIC_RATE_LIMIT_POLICIES.adminLogin;
  }

  if (normalizedMethod === "POST" && pathname === "/api/admin/auth/logout") {
    return PUBLIC_RATE_LIMIT_POLICIES.adminLogout;
  }

  return null;
}

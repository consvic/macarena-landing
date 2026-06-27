import { NextResponse } from "next/server";
import {
  unauthorizedJsonResponse,
  verifyAdminCredentials,
} from "@/lib/admin/auth";
import {
  ADMIN_SESSION_COOKIE_NAME,
  ADMIN_SESSION_MAX_AGE_SECONDS,
} from "@/lib/admin/constants";
import { createAdminSession } from "@/lib/admin/session";

const ADMIN_AUTH_DEBUG = process.env.ADMIN_AUTH_DEBUG === "true";

function debugAdminLogin(message: string, context?: Record<string, unknown>) {
  if (!ADMIN_AUTH_DEBUG) {
    return;
  }

  console.info(`[admin:auth:login] ${message}`, context ?? {});
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };

    const email = typeof body.email === "string" ? body.email : "";
    const password = typeof body.password === "string" ? body.password : "";

    debugAdminLogin("login request received", {
      email,
      hasPassword: Boolean(password),
    });

    const authorizedEmail = await verifyAdminCredentials(email, password);
    if (!authorizedEmail) {
      debugAdminLogin("credentials rejected", {
        email,
      });
      return unauthorizedJsonResponse();
    }

    debugAdminLogin("credentials accepted", {
      email: authorizedEmail,
    });

    const session = await createAdminSession(authorizedEmail);
    const response = NextResponse.json({ email: session.email });
    response.cookies.set({
      name: ADMIN_SESSION_COOKIE_NAME,
      value: session.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
    });

    debugAdminLogin("session cookie set", {
      email: session.email,
      cookieName: ADMIN_SESSION_COOKIE_NAME,
    });

    return response;
  } catch (error) {
    console.error("[admin:auth:login:POST]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

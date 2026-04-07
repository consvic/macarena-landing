import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE_NAME } from "@/lib/admin/constants";
import { parseCookieValue, revokeAdminSession } from "@/lib/admin/session";

export async function POST(request: Request) {
  try {
    const token = parseCookieValue(
      request.headers.get("cookie"),
      ADMIN_SESSION_COOKIE_NAME,
    );

    await revokeAdminSession(token);

    const response = new NextResponse(null, { status: 204 });
    response.cookies.set({
      name: ADMIN_SESSION_COOKIE_NAME,
      value: "",
      path: "/",
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("[admin:auth:logout:POST]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

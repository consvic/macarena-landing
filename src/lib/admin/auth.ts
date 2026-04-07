import { NextResponse } from "next/server";
import {
  getUnauthorizedHeaders,
  parseBasicAuthHeader,
} from "@/lib/admin/basic-auth";
import { normalizeAdminEmail, verifyPassword } from "@/lib/admin/password";
import {
  getAdminEmailFromSessionToken,
  getAdminSessionTokenFromRequest,
} from "@/lib/admin/session";
import { connectToDatabase } from "@/lib/db/mongoose";
import { AdminUserModel } from "@/models/AdminUser";

export async function verifyAdminCredentials(
  email: string,
  password: string,
): Promise<string | null> {
  const normalizedEmail = normalizeAdminEmail(email);
  if (!normalizedEmail || !password) {
    return null;
  }

  await connectToDatabase();

  const adminUser = await AdminUserModel.findOne({
    email: normalizedEmail,
  })
    .select({ email: 1, passwordHash: 1 })
    .lean();
  if (!adminUser || typeof adminUser.passwordHash !== "string") {
    return null;
  }

  const passwordMatches = await verifyPassword(
    password,
    adminUser.passwordHash,
  );
  if (!passwordMatches) {
    return null;
  }

  return normalizedEmail;
}

export async function getAuthorizedAdminUser(
  headerValue: string | null,
): Promise<string | null> {
  const provided = parseBasicAuthHeader(headerValue);
  if (!provided) {
    return null;
  }

  return verifyAdminCredentials(provided.username, provided.password);
}

export async function getAuthorizedAdminUserFromRequest(
  request: Request,
): Promise<string | null> {
  const basicAuthorizedUser = await getAuthorizedAdminUser(
    request.headers.get("authorization"),
  );
  if (basicAuthorizedUser) {
    return basicAuthorizedUser;
  }

  const sessionToken = getAdminSessionTokenFromRequest(request);
  return getAdminEmailFromSessionToken(sessionToken);
}

export function unauthorizedTextResponse() {
  return new NextResponse("Unauthorized", {
    status: 401,
    headers: getUnauthorizedHeaders(),
  });
}

export function unauthorizedJsonResponse() {
  return NextResponse.json(
    { message: "Unauthorized" },
    {
      status: 401,
      headers: getUnauthorizedHeaders(),
    },
  );
}

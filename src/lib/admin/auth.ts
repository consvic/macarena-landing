import { NextResponse } from "next/server";
import { ADMIN_AUTH_REALM } from "@/lib/admin/constants";
import { normalizeAdminEmail, verifyPassword } from "@/lib/admin/password";
import { connectToDatabase } from "@/lib/db/mongoose";
import { AdminUserModel } from "@/models/AdminUser";

type AdminCredential = {
  username: string;
  password: string;
};

function decodeBase64(input: string) {
  if (typeof atob === "function") {
    return atob(input);
  }

  return Buffer.from(input, "base64").toString("utf8");
}

export function parseBasicAuthHeader(
  headerValue: string | null,
): AdminCredential | null {
  if (!headerValue || !headerValue.startsWith("Basic ")) {
    return null;
  }

  const encoded = headerValue.slice("Basic ".length).trim();
  if (!encoded) {
    return null;
  }

  try {
    const decoded = decodeBase64(encoded);
    const separatorIndex = decoded.indexOf(":");
    if (separatorIndex <= 0) {
      return null;
    }

    return {
      username: decoded.slice(0, separatorIndex),
      password: decoded.slice(separatorIndex + 1),
    };
  } catch {
    return null;
  }
}

export async function getAuthorizedAdminUser(
  headerValue: string | null,
): Promise<string | null> {
  const provided = parseBasicAuthHeader(headerValue);
  if (!provided) {
    return null;
  }

  await connectToDatabase();

  const normalizedEmail = normalizeAdminEmail(provided.username);
  if (!normalizedEmail) {
    return null;
  }

  const adminUser = await AdminUserModel.findOne({
    email: normalizedEmail,
  })
    .select({ email: 1, passwordHash: 1 })
    .lean();
  if (!adminUser || typeof adminUser.passwordHash !== "string") {
    return null;
  }

  const passwordMatches = await verifyPassword(
    provided.password,
    adminUser.passwordHash,
  );
  if (!passwordMatches) {
    return null;
  }

  return normalizedEmail;
}

export async function getAuthorizedAdminUserFromRequest(
  request: Request,
): Promise<string | null> {
  const injectedUser = request.headers.get("x-admin-user");
  if (injectedUser) {
    return normalizeAdminEmail(injectedUser);
  }

  return getAuthorizedAdminUser(request.headers.get("authorization"));
}

export function getUnauthorizedHeaders() {
  return {
    "WWW-Authenticate": `Basic realm="${ADMIN_AUTH_REALM}", charset="UTF-8"`,
  };
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

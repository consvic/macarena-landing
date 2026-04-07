import { createHash, randomBytes } from "node:crypto";
import {
  ADMIN_SESSION_COOKIE_NAME,
  ADMIN_SESSION_MAX_AGE_SECONDS,
} from "@/lib/admin/constants";
import { normalizeAdminEmail } from "@/lib/admin/password";
import { connectToDatabase } from "@/lib/db/mongoose";
import { AdminSessionModel } from "@/models/AdminSession";

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function parseCookieValue(
  cookieHeader: string | null,
  name: string,
): string | null {
  if (!cookieHeader) {
    return null;
  }

  const parts = cookieHeader.split(";").map((part) => part.trim());
  const prefix = `${name}=`;
  const entry = parts.find((part) => part.startsWith(prefix));
  if (!entry) {
    return null;
  }

  const rawValue = entry.slice(prefix.length).trim();
  if (!rawValue) {
    return null;
  }

  try {
    return decodeURIComponent(rawValue);
  } catch {
    return rawValue;
  }
}

export function getAdminSessionTokenFromRequest(request: Request) {
  return parseCookieValue(
    request.headers.get("cookie"),
    ADMIN_SESSION_COOKIE_NAME,
  );
}

export async function createAdminSession(email: string) {
  await connectToDatabase();

  const normalizedEmail = normalizeAdminEmail(email);
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + ADMIN_SESSION_MAX_AGE_SECONDS * 1000);

  await AdminSessionModel.create({
    email: normalizedEmail,
    tokenHash,
    expiresAt,
  });

  return {
    token,
    email: normalizedEmail,
    expiresAt,
  };
}

export async function getAdminEmailFromSessionToken(token: string | null) {
  if (!token) {
    return null;
  }

  await connectToDatabase();

  const tokenHash = hashSessionToken(token);
  const session = await AdminSessionModel.findOne({
    tokenHash,
    expiresAt: { $gt: new Date() },
  })
    .select({ email: 1 })
    .lean();

  if (!session?.email) {
    return null;
  }

  return normalizeAdminEmail(session.email);
}

export async function revokeAdminSession(token: string | null) {
  if (!token) {
    return;
  }

  await connectToDatabase();
  const tokenHash = hashSessionToken(token);
  await AdminSessionModel.deleteOne({ tokenHash });
}

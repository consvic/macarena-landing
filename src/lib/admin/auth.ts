import { NextResponse } from "next/server";
import { parseBasicAuthHeader } from "@/lib/admin/basic-auth";
import { normalizeAdminEmail, verifyPassword } from "@/lib/admin/password";
import {
  getAdminEmailFromSessionToken,
  getAdminSessionTokenFromRequest,
} from "@/lib/admin/session";
import { connectToDatabase } from "@/lib/db/mongoose";
import { AdminUserModel } from "@/models/AdminUser";

const ADMIN_AUTH_DEBUG = process.env.ADMIN_AUTH_DEBUG === "true";
const ADMIN_USER_COLLECTION_NAME = "admin-users";

function debugAdminAuth(message: string, context?: Record<string, unknown>) {
  if (!ADMIN_AUTH_DEBUG) {
    return;
  }

  console.info(`[admin:auth] ${message}`, context ?? {});
}

function getStoredHashDebugContext(passwordHash: string | undefined) {
  if (typeof passwordHash !== "string") {
    return {
      hasPasswordHash: false,
      passwordHashType: typeof passwordHash,
    };
  }

  const [algorithm, params, salt, hash] = passwordHash.split("$");
  return {
    hasPasswordHash: true,
    hashAlgorithm: algorithm || null,
    hasHashParams: Boolean(params),
    saltHexLength: salt?.length ?? 0,
    hashHexLength: hash?.length ?? 0,
  };
}

function getMongoUriDebugContext() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return {
      mongoUriConfigured: false,
    };
  }

  try {
    const parsedUri = new URL(uri);
    return {
      mongoUriConfigured: true,
      mongoUriProtocol: parsedUri.protocol.replace(":", ""),
      mongoUriHost: parsedUri.host,
      mongoUriPathname: parsedUri.pathname || null,
    };
  } catch {
    return {
      mongoUriConfigured: true,
      mongoUriParseable: false,
    };
  }
}

async function getAdminUserLookupFailureDebugContext() {
  if (!ADMIN_AUTH_DEBUG) {
    return {};
  }

  try {
    const [adminUserCount, sampleAdminUsers] = await Promise.all([
      AdminUserModel.countDocuments({}),
      AdminUserModel.find({})
        .select({ email: 1 })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    return {
      adminUserCount,
      sampleAdminEmails: sampleAdminUsers.map((user) => ({
        email: typeof user.email === "string" ? user.email : null,
        emailLength: typeof user.email === "string" ? user.email.length : null,
      })),
    };
  } catch (error) {
    return {
      adminUserDebugProbeError:
        error instanceof Error ? error.message : String(error),
    };
  }
}

export async function verifyAdminCredentials(
  email: string,
  password: string,
): Promise<string | null> {
  const normalizedEmail = normalizeAdminEmail(email);
  if (!normalizedEmail || !password) {
    debugAdminAuth("missing credentials", {
      hasEmail: Boolean(normalizedEmail),
      hasPassword: Boolean(password),
    });
    return null;
  }

  const connection = await connectToDatabase();
  debugAdminAuth("looking up admin user", {
    dbName: connection?.connection?.name ?? null,
    collection: ADMIN_USER_COLLECTION_NAME,
    modelCollectionName: AdminUserModel.collection?.name ?? null,
    modelDbName: AdminUserModel.db?.name ?? null,
    email: normalizedEmail,
    ...getMongoUriDebugContext(),
  });

  const adminUser = await AdminUserModel.findOne({
    email: normalizedEmail,
  })
    .select({ email: 1, passwordHash: 1 })
    .lean();
  if (!adminUser || typeof adminUser.passwordHash !== "string") {
    debugAdminAuth("admin user lookup failed", {
      found: Boolean(adminUser),
      email: normalizedEmail,
      ...getStoredHashDebugContext(adminUser?.passwordHash),
      ...(await getAdminUserLookupFailureDebugContext()),
    });
    return null;
  }

  debugAdminAuth("admin user lookup succeeded", {
    email: normalizedEmail,
    ...getStoredHashDebugContext(adminUser.passwordHash),
  });

  const passwordMatches = await verifyPassword(
    password,
    adminUser.passwordHash,
  );
  if (!passwordMatches) {
    debugAdminAuth("password verification failed", {
      email: normalizedEmail,
    });
    return null;
  }

  debugAdminAuth("password verification succeeded", {
    email: normalizedEmail,
  });

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
  });
}

export function unauthorizedJsonResponse() {
  return NextResponse.json(
    { message: "Unauthorized" },
    {
      status: 401,
    },
  );
}

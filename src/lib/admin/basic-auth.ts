import { ADMIN_AUTH_REALM } from "@/lib/admin/constants";

export type AdminCredential = {
  username: string;
  password: string;
};

function decodeBase64(input: string) {
  if (typeof atob === "function") {
    return atob(input);
  }

  if (typeof Buffer !== "undefined") {
    return Buffer.from(input, "base64").toString("utf8");
  }

  throw new Error("No base64 decoder available");
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

export function getUnauthorizedHeaders() {
  return {
    "WWW-Authenticate": `Basic realm="${ADMIN_AUTH_REALM}", charset="UTF-8"`,
  };
}

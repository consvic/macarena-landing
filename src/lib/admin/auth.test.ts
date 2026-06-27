import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getAuthorizedAdminUser,
  getAuthorizedAdminUserFromRequest,
  unauthorizedJsonResponse,
  unauthorizedTextResponse,
} from "@/lib/admin/auth";
import { parseBasicAuthHeader } from "@/lib/admin/basic-auth";

const connectToDatabaseMock = vi.fn();
const findOneMock = vi.fn();
const selectMock = vi.fn();
const leanMock = vi.fn();
const verifyPasswordMock = vi.fn();
const getAdminEmailFromSessionTokenMock = vi.fn();
const getAdminSessionTokenFromRequestMock = vi.fn();

vi.mock("@/lib/db/mongoose", () => ({
  connectToDatabase: () => connectToDatabaseMock(),
}));

vi.mock("@/models/AdminUser", () => ({
  AdminUserModel: {
    findOne: (...args: unknown[]) => findOneMock(...args),
  },
}));

vi.mock("@/lib/admin/password", async () => {
  const original = await vi.importActual<typeof import("@/lib/admin/password")>(
    "@/lib/admin/password",
  );

  return {
    ...original,
    verifyPassword: (...args: unknown[]) => verifyPasswordMock(...args),
  };
});

vi.mock("@/lib/admin/session", () => ({
  getAdminEmailFromSessionToken: (...args: unknown[]) =>
    getAdminEmailFromSessionTokenMock(...args),
  getAdminSessionTokenFromRequest: (...args: unknown[]) =>
    getAdminSessionTokenFromRequestMock(...args),
}));

describe("admin auth", () => {
  beforeEach(() => {
    connectToDatabaseMock.mockReset();
    findOneMock.mockReset();
    selectMock.mockReset();
    leanMock.mockReset();
    verifyPasswordMock.mockReset();
    getAdminEmailFromSessionTokenMock.mockReset();
    getAdminSessionTokenFromRequestMock.mockReset();

    findOneMock.mockReturnValue({ select: selectMock });
    selectMock.mockReturnValue({ lean: leanMock });
  });

  it("parses a basic auth header", () => {
    const credential = parseBasicAuthHeader("Basic YWxpY2U6b25l");
    expect(credential).toEqual({ username: "alice", password: "one" });
  });

  it("returns null when auth header is missing", async () => {
    const result = await getAuthorizedAdminUser(null);
    expect(result).toBeNull();
    expect(connectToDatabaseMock).not.toHaveBeenCalled();
  });

  it("returns null when email does not exist", async () => {
    leanMock.mockResolvedValue(null);

    const result = await getAuthorizedAdminUser(
      "Basic Ym9iQGV4YW1wbGUuY29tOnR3bw==",
    );

    expect(connectToDatabaseMock).toHaveBeenCalledTimes(1);
    expect(findOneMock).toHaveBeenCalledWith({ email: "bob@example.com" });
    expect(result).toBeNull();
  });

  it("returns normalized email when credentials match", async () => {
    leanMock.mockResolvedValue({
      email: "bob@example.com",
      passwordHash: "scrypt$n=16384,r=8,p=1$abc$def",
    });
    verifyPasswordMock.mockResolvedValue(true);

    const result = await getAuthorizedAdminUser(
      "Basic IEJvYkBFeGFtcGxlLmNvbSA6c2VjcmV0",
    );

    expect(connectToDatabaseMock).toHaveBeenCalledTimes(1);
    expect(findOneMock).toHaveBeenCalledWith({ email: "bob@example.com" });
    expect(verifyPasswordMock).toHaveBeenCalledWith(
      "secret",
      "scrypt$n=16384,r=8,p=1$abc$def",
    );
    expect(result).toBe("bob@example.com");
  });

  it("rejects wrong password", async () => {
    leanMock.mockResolvedValue({
      email: "alice@example.com",
      passwordHash: "scrypt$n=16384,r=8,p=1$abc$def",
    });
    verifyPasswordMock.mockResolvedValue(false);

    const result = await getAuthorizedAdminUser(
      "Basic YWxpY2VAZXhhbXBsZS5jb206YmFk",
    );

    expect(result).toBeNull();
  });

  it("reads credentials from authorization header in request", async () => {
    leanMock.mockResolvedValue({
      email: "admin@example.com",
      passwordHash: "scrypt$n=16384,r=8,p=1$abc$def",
    });
    verifyPasswordMock.mockResolvedValue(true);

    const request = new Request("http://localhost/api/admin/orders", {
      headers: {
        authorization: "Basic YWRtaW5AZXhhbXBsZS5jb206c2VjcmV0",
      },
    });

    const result = await getAuthorizedAdminUserFromRequest(request);

    expect(result).toBe("admin@example.com");
    expect(connectToDatabaseMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to session token when authorization header is missing", async () => {
    getAdminSessionTokenFromRequestMock.mockReturnValue("session-token");
    getAdminEmailFromSessionTokenMock.mockResolvedValue("admin@example.com");

    const request = new Request("http://localhost/api/admin/orders");
    const result = await getAuthorizedAdminUserFromRequest(request);

    expect(getAdminSessionTokenFromRequestMock).toHaveBeenCalledWith(request);
    expect(getAdminEmailFromSessionTokenMock).toHaveBeenCalledWith(
      "session-token",
    );
    expect(result).toBe("admin@example.com");
  });

  it("does not send a Basic Auth challenge for text unauthorized responses", () => {
    const response = unauthorizedTextResponse();

    expect(response.status).toBe(401);
    expect(response.headers.get("www-authenticate")).toBeNull();
  });

  it("does not send a Basic Auth challenge for json unauthorized responses", async () => {
    const response = unauthorizedJsonResponse();

    expect(response.status).toBe(401);
    expect(response.headers.get("www-authenticate")).toBeNull();
    await expect(response.json()).resolves.toEqual({
      message: "Unauthorized",
    });
  });
});

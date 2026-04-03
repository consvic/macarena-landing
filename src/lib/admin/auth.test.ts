import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getAuthorizedAdminUser,
  getAuthorizedAdminUserFromRequest,
  parseBasicAuthHeader,
} from "@/lib/admin/auth";

const connectToDatabaseMock = vi.fn();
const findOneMock = vi.fn();
const selectMock = vi.fn();
const leanMock = vi.fn();
const verifyPasswordMock = vi.fn();

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

describe("admin auth", () => {
  beforeEach(() => {
    connectToDatabaseMock.mockReset();
    findOneMock.mockReset();
    selectMock.mockReset();
    leanMock.mockReset();
    verifyPasswordMock.mockReset();

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

  it("uses injected x-admin-user header when available", async () => {
    const request = new Request("http://localhost/api/admin/orders", {
      headers: {
        "x-admin-user": "  Admin@Example.com  ",
      },
    });

    const result = await getAuthorizedAdminUserFromRequest(request);

    expect(result).toBe("admin@example.com");
    expect(connectToDatabaseMock).not.toHaveBeenCalled();
  });
});

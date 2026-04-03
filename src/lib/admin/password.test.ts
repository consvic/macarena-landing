import { describe, expect, it } from "vitest";
import {
  hashPassword,
  normalizeAdminEmail,
  verifyPassword,
} from "@/lib/admin/password";

describe("admin password utilities", () => {
  it("normalizes admin email", () => {
    expect(normalizeAdminEmail("  Admin@Example.com ")).toBe(
      "admin@example.com",
    );
  });

  it("hashes and verifies a password", async () => {
    const plain = "very-secure-password";
    const hashed = await hashPassword(plain);

    expect(hashed).toMatch(/^scrypt\$n=\d+,r=\d+,p=\d+\$[a-f0-9]+\$[a-f0-9]+$/);
    await expect(verifyPassword(plain, hashed)).resolves.toBe(true);
    await expect(verifyPassword("incorrect-password", hashed)).resolves.toBe(
      false,
    );
  });

  it("fails safely for malformed stored hashes", async () => {
    await expect(verifyPassword("password", "bad-format")).resolves.toBe(false);
  });

  it("rejects too-short passwords", async () => {
    await expect(hashPassword("short")).rejects.toThrow(
      "Password must be at least 8 characters long",
    );
  });
});

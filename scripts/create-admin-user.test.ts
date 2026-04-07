import { describe, expect, it } from "vitest";
import { parseCliArgs } from "./create-admin-user.mjs";

describe("create-admin-user script", () => {
  it("parses valid args", () => {
    expect(
      parseCliArgs([
        "--email",
        " Admin@Example.com ",
        "--password",
        "strong-password",
      ]),
    ).toEqual({
      email: "admin@example.com",
      password: "strong-password",
    });
  });

  it("fails when required args are missing", () => {
    expect(() => parseCliArgs(["--email", "admin@example.com"])).toThrow(
      "Both --email and --password are required",
    );
  });

  it("fails for unknown args", () => {
    expect(() => parseCliArgs(["--foo", "bar"])).toThrow("Unknown argument");
  });

  it("fails for invalid email", () => {
    expect(() =>
      parseCliArgs(["--email", "invalid", "--password", "strong-password"]),
    ).toThrow("Invalid email format");
  });

  it("fails for short password", () => {
    expect(() =>
      parseCliArgs(["--email", "admin@example.com", "--password", "short"]),
    ).toThrow("Password must be at least 8 characters long");
  });
});

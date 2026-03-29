import { beforeEach, describe, expect, it, vi } from "vitest";

const connectMock = vi.fn();

vi.mock("mongoose", () => ({
  default: {
    connect: (...args: unknown[]) => connectMock(...args),
  },
}));

describe("connectToDatabase", () => {
  beforeEach(() => {
    connectMock.mockReset();
    // Reset the cached global between tests
    global.mongooseCache = { conn: null, promise: null };
    vi.stubEnv("MONGODB_URI", "mongodb://localhost:27017/test");
  });

  it("throws when MONGODB_URI is missing", async () => {
    vi.stubEnv("MONGODB_URI", "");

    // Need fresh import to pick up the cleared env
    vi.resetModules();
    const { connectToDatabase } = await import("@/lib/db/mongoose");

    await expect(connectToDatabase()).rejects.toThrow("Missing MONGODB_URI");
  });

  it("clears cached promise on connection failure so retries work", async () => {
    connectMock.mockRejectedValueOnce(new Error("Connection refused"));
    connectMock.mockResolvedValueOnce({ connection: "ok" });

    vi.resetModules();
    const { connectToDatabase } = await import("@/lib/db/mongoose");

    await expect(connectToDatabase()).rejects.toThrow("Connection refused");

    // Second call should retry instead of returning the failed promise
    const result = await connectToDatabase();
    expect(result).toEqual({ connection: "ok" });
    expect(connectMock).toHaveBeenCalledTimes(2);
  });
});

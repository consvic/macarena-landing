import { beforeEach, describe, expect, it } from "vitest";
import {
  checkRateLimit,
  clearRateLimitStore,
  getClientIdentifier,
  type RateLimitPolicy,
} from "@/lib/rate-limit";

const POLICY: RateLimitPolicy = {
  id: "test-policy",
  limit: 2,
  windowMs: 1000,
};

describe("rate limit", () => {
  beforeEach(() => {
    clearRateLimitStore();
  });

  it("limits requests until the fixed window resets", () => {
    const first = checkRateLimit(POLICY, "203.0.113.20", 1000);
    const second = checkRateLimit(POLICY, "203.0.113.20", 1200);
    const third = checkRateLimit(POLICY, "203.0.113.20", 1400);
    const afterReset = checkRateLimit(POLICY, "203.0.113.20", 2000);

    expect(first).toEqual(
      expect.objectContaining({
        limited: false,
        remaining: 1,
        resetAt: 2000,
      }),
    );
    expect(second).toEqual(
      expect.objectContaining({
        limited: false,
        remaining: 0,
        resetAt: 2000,
      }),
    );
    expect(third).toEqual(
      expect.objectContaining({
        limited: true,
        remaining: 0,
        resetAt: 2000,
      }),
    );
    expect(afterReset).toEqual(
      expect.objectContaining({
        limited: false,
        remaining: 1,
        resetAt: 3000,
      }),
    );
  });

  it("uses the first x-forwarded-for IP as the client identifier", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.21, 198.51.100.1",
      "x-real-ip": "198.51.100.2",
    });

    expect(getClientIdentifier(headers)).toBe("203.0.113.21");
  });

  it("falls back to x-real-ip when x-forwarded-for is missing", () => {
    const headers = new Headers({
      "x-real-ip": "198.51.100.3",
    });

    expect(getClientIdentifier(headers)).toBe("198.51.100.3");
  });

  it("uses a stable fallback when no client IP headers are present", () => {
    expect(getClientIdentifier(new Headers())).toBe("unknown");
  });
});

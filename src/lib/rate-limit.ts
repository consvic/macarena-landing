import { NextResponse } from "next/server";

export type RateLimitPolicy = {
  id: string;
  limit: number;
  windowMs: number;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitStore = {
  entries: Map<string, RateLimitEntry>;
  lastCleanupAt: number;
};

type RateLimitResult = {
  limit: number;
  limited: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
};

declare global {
  // eslint-disable-next-line no-var
  var macarenaRateLimitStore: RateLimitStore | undefined;
}

const CLEANUP_INTERVAL_MS = 60 * 1000;
const UNKNOWN_CLIENT_IDENTIFIER = "unknown";

const rateLimitStore = globalThis.macarenaRateLimitStore ?? {
  entries: new Map<string, RateLimitEntry>(),
  lastCleanupAt: 0,
};

globalThis.macarenaRateLimitStore = rateLimitStore;

export function getClientIdentifier(headers: Headers) {
  const forwardedFor = headers.get("x-forwarded-for");
  const forwardedIp = forwardedFor?.split(",")[0]?.trim();
  if (forwardedIp) {
    return forwardedIp;
  }

  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) {
    return realIp;
  }

  return UNKNOWN_CLIENT_IDENTIFIER;
}

export function checkRateLimit(
  policy: RateLimitPolicy,
  identifier: string,
  now = Date.now(),
): RateLimitResult {
  cleanupExpiredEntries(now);

  const key = `${policy.id}:${identifier}`;
  const entry = rateLimitStore.entries.get(key);

  if (!entry || entry.resetAt <= now) {
    const resetAt = now + policy.windowMs;
    rateLimitStore.entries.set(key, {
      count: 1,
      resetAt,
    });

    return {
      limit: policy.limit,
      limited: false,
      remaining: Math.max(policy.limit - 1, 0),
      resetAt,
      retryAfterSeconds: Math.ceil(policy.windowMs / 1000),
    };
  }

  if (entry.count >= policy.limit) {
    return {
      limit: policy.limit,
      limited: true,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfterSeconds: getRetryAfterSeconds(entry.resetAt, now),
    };
  }

  entry.count += 1;

  return {
    limit: policy.limit,
    limited: false,
    remaining: Math.max(policy.limit - entry.count, 0),
    resetAt: entry.resetAt,
    retryAfterSeconds: getRetryAfterSeconds(entry.resetAt, now),
  };
}

export function createRateLimitResponse(result: RateLimitResult) {
  return NextResponse.json(
    { message: "Too many requests" },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSeconds),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
      },
    },
  );
}

export function clearRateLimitStore() {
  rateLimitStore.entries.clear();
  rateLimitStore.lastCleanupAt = 0;
}

function cleanupExpiredEntries(now: number) {
  if (now - rateLimitStore.lastCleanupAt < CLEANUP_INTERVAL_MS) {
    return;
  }

  for (const [key, entry] of rateLimitStore.entries) {
    if (entry.resetAt <= now) {
      rateLimitStore.entries.delete(key);
    }
  }

  rateLimitStore.lastCleanupAt = now;
}

function getRetryAfterSeconds(resetAt: number, now: number) {
  return Math.max(1, Math.ceil((resetAt - now) / 1000));
}

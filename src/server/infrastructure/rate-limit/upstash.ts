import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type {
  RateLimitDecision,
  RateLimiter,
} from "@/server/domain/rate-limit";
import { createMemoryRateLimiter } from "./memory";

export type RateLimiterOptions = {
  limit: number;
  windowMinutes: number;
  prefix: string;
};

// Upstash when configured; otherwise (and on Upstash errors) a per-instance
// in-memory limiter. Construction never throws — the container is built eagerly.
export function createRateLimiter(options: RateLimiterOptions): RateLimiter {
  const fallback = createMemoryRateLimiter({
    limit: options.limit,
    windowMs: options.windowMinutes * 60_000,
  });
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[rate-limit] Upstash not configured — using per-instance in-memory limiter.",
      );
    }
    return fallback;
  }

  const ratelimit = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(
      options.limit,
      `${options.windowMinutes} m`,
    ),
    prefix: options.prefix,
    analytics: false,
  });

  return {
    async check(key): Promise<RateLimitDecision> {
      try {
        const result = await ratelimit.limit(key);
        return {
          allowed: result.success,
          retryAfterSeconds: Math.max(
            0,
            Math.ceil((result.reset - Date.now()) / 1000),
          ),
        };
      } catch {
        console.error(
          "[rate-limit] Upstash check failed — using in-memory fallback.",
        );
        return fallback.check(key);
      }
    },
  };
}

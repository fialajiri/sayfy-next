import type {
  RateLimitDecision,
  RateLimiter,
} from "@/server/domain/rate-limit";

// Per-process sliding-window limiter. On serverless each instance has its own
// window, so this is weaker than Upstash — but far better than failing open.
export function createMemoryRateLimiter(
  options: { limit: number; windowMs: number },
  now: () => number = Date.now,
): RateLimiter {
  const hits = new Map<string, number[]>();

  return {
    async check(key): Promise<RateLimitDecision> {
      const t = now();
      const recent = (hits.get(key) ?? []).filter(
        (at) => t - at < options.windowMs,
      );
      if (recent.length >= options.limit) {
        hits.set(key, recent);
        const retryAfterSeconds = Math.ceil(
          (recent[0] + options.windowMs - t) / 1000,
        );
        return { allowed: false, retryAfterSeconds };
      }
      recent.push(t);
      hits.set(key, recent);
      if (hits.size > 10_000) hits.delete(hits.keys().next().value ?? key); // bound memory
      return { allowed: true, retryAfterSeconds: 0 };
    },
  };
}

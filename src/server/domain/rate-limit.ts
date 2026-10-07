export type RateLimitDecision = { allowed: boolean; retryAfterSeconds: number };

// Brute-force protection for the admin login. Unlike zive-teplice this does not
// fail fully open: without Upstash it falls back to a per-instance limiter.
export type RateLimiter = { check(key: string): Promise<RateLimitDecision> };

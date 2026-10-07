import type {
  RateLimitDecision,
  RateLimiter,
} from "@/server/domain/rate-limit";

export type RateLimitKeys = { ip: string; identifier: string };

// Copied from zive-teplice: the IP key stops one attacker rotating emails, the
// identifier key stops credential stuffing against one account from many IPs.
export async function checkRateLimit(
  limiter: RateLimiter,
  keys: RateLimitKeys,
): Promise<RateLimitDecision> {
  const [byIp, byIdentifier] = await Promise.all([
    limiter.check(`ip:${keys.ip}`),
    limiter.check(`id:${keys.identifier.trim().toLowerCase()}`),
  ]);
  if (!byIp.allowed) return byIp;
  if (!byIdentifier.allowed) return byIdentifier;
  return { allowed: true, retryAfterSeconds: 0 };
}

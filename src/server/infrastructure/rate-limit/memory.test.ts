import { createMemoryRateLimiter } from "./memory";

describe("createMemoryRateLimiter", () => {
  it("allows up to the limit, blocks, then recovers after the window", async () => {
    let t = 0;
    const limiter = createMemoryRateLimiter(
      { limit: 2, windowMs: 60_000 },
      () => t,
    );
    expect((await limiter.check("ip:1")).allowed).toBe(true);
    expect((await limiter.check("ip:1")).allowed).toBe(true);
    const blocked = await limiter.check("ip:1");
    expect(blocked).toEqual({ allowed: false, retryAfterSeconds: 60 });
    expect((await limiter.check("ip:2")).allowed).toBe(true); // keys are independent
    t = 60_001;
    expect((await limiter.check("ip:1")).allowed).toBe(true);
  });
});

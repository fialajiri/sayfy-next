import { z } from "zod";
import { parseEnv, requireEnv } from "./env";

const schema = z.object({
  MONGODB_URI: z.string().startsWith("mongodb"),
  AWS_REGION: z.string().min(1),
});

describe("parseEnv", () => {
  it("returns the typed values when valid", () => {
    const result = parseEnv(schema, {
      MONGODB_URI: "mongodb://x",
      AWS_REGION: "eu-central-1",
    });
    expect(result).toEqual({
      ok: true,
      value: { MONGODB_URI: "mongodb://x", AWS_REGION: "eu-central-1" },
    });
  });

  it("names every missing or invalid variable", () => {
    const result = parseEnv(schema, { MONGODB_URI: "postgres://x" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.message).toContain("MONGODB_URI");
    expect(result.message).toContain("AWS_REGION");
    expect(result.message).toContain(".env.example");
  });
});

describe("requireEnv", () => {
  it("throws a readable error when invalid", () => {
    expect(() => requireEnv(schema, {})).toThrow(
      /Invalid environment configuration/,
    );
  });
});

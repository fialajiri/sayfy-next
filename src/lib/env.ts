import { z } from "zod";

export type EnvSource = Record<string, string | undefined>;

export type EnvParseResult<T> =
  { ok: true; value: T } | { ok: false; message: string };

// Parse a slice of environment variables against a schema. Each feature (DB,
// auth, storage…) declares its own schema, so a missing upload key never
// blocks pages that don't upload.
export function parseEnv<T extends z.ZodType>(
  schema: T,
  source: EnvSource,
): EnvParseResult<z.infer<T>> {
  const parsed = schema.safeParse(source);
  if (parsed.success) return { ok: true, value: parsed.data };

  const problems = parsed.error.issues.map((issue) => {
    const name = issue.path.join(".") || "(root)";
    return `  - ${name}: ${issue.message}`;
  });
  return {
    ok: false,
    message: `Invalid environment configuration:\n${problems.join("\n")}\nSee .env.example.`,
  };
}

// Boot-time configuration is the one place we fail loudly: a misconfigured
// deployment must not start serving with half its features silently broken.
export function requireEnv<T extends z.ZodType>(
  schema: T,
  source: EnvSource = process.env,
): z.infer<T> {
  const result = parseEnv(schema, source);
  if (!result.ok) throw new Error(result.message);
  return result.value;
}

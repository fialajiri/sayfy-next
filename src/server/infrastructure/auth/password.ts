import "server-only";
import { pbkdf2, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const pbkdf2Async = promisify(pbkdf2);

// Frozen legacy format from sayfy-backend-ts/src/services/password.ts:
//   password = hex(pbkdf2(plain, saltHex, 25000, 512, "sha256")) + "." + saltHex
// The salt is the hex STRING itself (never decoded). Must match exactly, or
// existing admins can't log in. New hashes use the same format until cutover
// (the legacy backend still reads this field) — docs/05 §Auth.
const PARAMS = { iterations: 25_000, keylen: 512, digest: "sha256" } as const;
const LEGACY_FORMAT = /^[0-9a-f]{1024}\.[0-9a-f]{64}$/;

export function isLegacyPasswordFormat(stored: string): boolean {
  return LEGACY_FORMAT.test(stored);
}

export async function verifyLegacyPassword(
  stored: string,
  supplied: string,
): Promise<boolean> {
  if (!isLegacyPasswordFormat(stored)) return false;
  const [hashHex, salt] = stored.split(".");
  const expected = Buffer.from(hashHex, "hex");
  const derived = await pbkdf2Async(
    supplied,
    salt,
    PARAMS.iterations,
    PARAMS.keylen,
    PARAMS.digest,
  );
  return (
    derived.length === expected.length && timingSafeEqual(derived, expected)
  );
}

export async function hashLegacyPassword(password: string): Promise<string> {
  const salt = randomBytes(32).toString("hex");
  const hash = await pbkdf2Async(
    password,
    salt,
    PARAMS.iterations,
    PARAMS.keylen,
    PARAMS.digest,
  );
  return `${hash.toString("hex")}.${salt}`;
}

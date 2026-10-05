/**
 * Clone production MongoDB into an isolated TEST database on the same cluster
 * (docs/plans/phase-1 §0a). Production is only READ (mongodump).
 *
 *   mongodump (prod, excluding `logs`) → mongorestore --drop into <prod-db>-test
 *   → optionally add a test-only admin with a known password.
 *
 * Real admin users are copied untouched so Phase 2 can verify legacy hashes.
 *
 * Env (.env.local):
 *   MONGODB_URI_PROD     source; falls back to MONGODB_URI if that is NOT a test DB
 *   TEST_DB_NAME         optional target name (default "<prod-db>-test")
 *   TEST_ADMIN_PASSWORD  optional; creates/updates test-admin@example.test
 *
 * Requires MongoDB Database Tools (`brew install mongodb-database-tools`).
 * Run: npm run db:clone-to-test -- --yes   (--yes required: the test DB is DROPPED)
 */
import { execFileSync } from "node:child_process";
import { pbkdf2Sync, randomBytes } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import mongoose from "mongoose";

const TEST_ADMIN_EMAIL = "test-admin@example.test";

function dbNameOf(uri: string): string {
  return new URL(uri).pathname.replace(/^\//, "");
}

function withDb(uri: string, db: string): string {
  const url = new URL(uri);
  url.pathname = `/${db}`;
  return url.toString();
}

function maskUri(uri: string): string {
  return uri.replace(/\/\/[^@]*@/, "//<credentials>@");
}

function sourceUri(): string {
  const explicit = process.env.MONGODB_URI_PROD?.trim();
  if (explicit) return explicit;
  const fallback = process.env.MONGODB_URI?.trim();
  if (fallback && !dbNameOf(fallback).includes("test")) return fallback;
  console.error(
    "✖ Set MONGODB_URI_PROD (MONGODB_URI already points at a test DB).",
  );
  process.exit(1);
}

// Same frozen legacy format as the Express backend: "<hashHex>.<saltHex>".
function hashLegacyPassword(password: string): string {
  const salt = randomBytes(32).toString("hex");
  const hash = pbkdf2Sync(password, salt, 25_000, 512, "sha256").toString(
    "hex",
  );
  return `${hash}.${salt}`;
}

// Errors from execFileSync embed the full command line (incl. the URI with
// credentials), so rethrow a sanitized message instead.
function run(command: string, args: string[]): void {
  try {
    execFileSync(command, args, { stdio: ["ignore", "inherit", "inherit"] });
  } catch {
    throw new Error(`${command} failed (see its output above)`);
  }
}

async function upsertTestAdmin(
  targetUri: string,
  password: string,
): Promise<void> {
  await mongoose.connect(targetUri, {
    maxPoolSize: 2,
    serverSelectionTimeoutMS: 8000,
  });
  try {
    const users = mongoose.connection.collection("users");
    const now = new Date();
    await users.updateOne(
      { email: TEST_ADMIN_EMAIL },
      {
        $set: {
          password: hashLegacyPassword(password),
          isAdmin: true,
          updatedAt: now,
        },
        $setOnInsert: { email: TEST_ADMIN_EMAIL, createdAt: now },
      },
      { upsert: true },
    );
    console.log(
      `✓ Test admin ${TEST_ADMIN_EMAIL} ready (password from TEST_ADMIN_PASSWORD)`,
    );
  } finally {
    await mongoose.disconnect();
  }
}

async function main(): Promise<void> {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // env may already be exported
  }
  if (!process.argv.includes("--yes")) {
    console.error(
      "✖ This DROPS and recreates the test database. Re-run with --yes.",
    );
    process.exit(1);
  }

  const source = sourceUri();
  const sourceDb = dbNameOf(source);
  const targetDb = process.env.TEST_DB_NAME?.trim() || `${sourceDb}-test`;
  if (!targetDb.includes("test") || targetDb === sourceDb) {
    console.error(
      `✖ Refusing target "${targetDb}": must contain "test" and differ from source.`,
    );
    process.exit(1);
  }
  const target = withDb(source, targetDb);
  console.log(`Source: ${maskUri(source)}\nTarget: ${maskUri(target)}\n`);

  const dir = mkdtempSync(join(tmpdir(), "sayfy-clone-"));
  try {
    run("mongodump", [
      `--uri=${source}`,
      "--excludeCollection=logs",
      `--out=${dir}`,
    ]);
    run("mongorestore", [
      `--uri=${withDb(source, "")}`,
      `--nsInclude=${sourceDb}.*`,
      `--nsFrom=${sourceDb}.*`,
      `--nsTo=${targetDb}.*`,
      "--drop",
      dir,
    ]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  console.log(`\n✓ Cloned "${sourceDb}" → "${targetDb}" (logs excluded)`);

  const password = process.env.TEST_ADMIN_PASSWORD?.trim();
  if (password) await upsertTestAdmin(target, password);
  else console.log("ℹ TEST_ADMIN_PASSWORD not set — no test admin created.");
}

main().catch((error: unknown) => {
  console.error("✖", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

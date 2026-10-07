/**
 * Create an admin, or reset an existing admin's password (legacy "hash.salt"
 * format, so the old backend still accepts it during the overlap).
 *
 *   npx tsx scripts/create-admin.ts --email someone@example.cz [--reset]
 *   npx tsx scripts/create-admin.ts --email x --password-env TEST_ADMIN_PASSWORD   (non-interactive)
 *
 * The password is prompted WITHOUT echo — never pass it as an argument (shell
 * history). Test DB only unless --prod --yes (seed-guard).
 */
import { pbkdf2Sync, randomBytes } from "node:crypto";
import { createInterface } from "node:readline";
import mongoose from "mongoose";
import { runSeed } from "./seed-guard";

function arg(name: string): string | null {
  const i = process.argv.indexOf(name);
  return i > -1 ? (process.argv[i + 1] ?? null) : null;
}

// Mirrors src/server/infrastructure/auth/password.ts (that module is server-only).
function hashLegacyPassword(password: string): string {
  const salt = randomBytes(32).toString("hex");
  return `${pbkdf2Sync(password, salt, 25_000, 512, "sha256").toString("hex")}.${salt}`;
}

function promptHidden(question: string): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });
  const mutable = rl as unknown as { _writeToOutput: (s: string) => void };
  let prompted = false;
  mutable._writeToOutput = (s) => {
    if (!prompted) {
      process.stdout.write(s);
      prompted = true;
    }
  };
  return new Promise((resolve) =>
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    }),
  );
}

async function readPassword(): Promise<string> {
  const envName = arg("--password-env");
  if (envName) return process.env[envName] ?? "";
  const first = await promptHidden("Heslo (min. 12 znaků): ");
  const second = await promptHidden("Heslo znovu: ");
  if (first !== second) throw new Error("Hesla se neshodují.");
  return first;
}

void runSeed("create-admin", async () => {
  const email = arg("--email")?.trim().toLowerCase();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    throw new Error("Zadejte --email.");
  const password = await readPassword();
  if (password.length < 12) throw new Error("Heslo musí mít alespoň 12 znaků.");

  const users = mongoose.connection.collection("users");
  const existing = await users.findOne({
    email: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
  });
  if (existing && !process.argv.includes("--reset"))
    throw new Error(`${email} už existuje (použijte --reset).`);

  const now = new Date();
  if (existing) {
    await users.updateOne(
      { _id: existing._id },
      {
        $set: {
          password: hashLegacyPassword(password),
          isAdmin: true,
          updatedAt: now,
        },
      },
    );
    return `${email}: heslo změněno`;
  }
  await users.insertOne({
    email,
    password: hashLegacyPassword(password),
    isAdmin: true,
    createdAt: now,
    updatedAt: now,
  });
  return `${email}: admin vytvořen`;
});

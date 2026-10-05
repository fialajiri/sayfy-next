/**
 * Read-only MongoDB check. Connects with MONGODB_URI (or --uri-env NAME), pings,
 * lists collections with counts and verifies the legacy shapes Phase 1 relies on.
 * Makes NO writes and never prints emails, hashes or credentials.
 *
 * Run: npm run db:check            (MONGODB_URI)
 *      npm run db:check -- --uri-env MONGODB_URI_PROD
 */
import mongoose from "mongoose";

const EXPECTED = ["users", "aktualitas", "galleries", "staticpages"] as const;
const PROPOZICE_ID = "635c21aea369bc4f74025d04";

function envName(): string {
  const index = process.argv.indexOf("--uri-env");
  return index > -1
    ? (process.argv[index + 1] ?? "MONGODB_URI")
    : "MONGODB_URI";
}

async function report(db: mongoose.mongo.Db): Promise<void> {
  const names = (await db.listCollections().toArray())
    .map((c) => c.name)
    .sort();
  console.log(`\nCollections (${names.length}):`);
  for (const name of names) {
    const count = await db.collection(name).estimatedDocumentCount();
    const mark = (EXPECTED as readonly string[]).includes(name) ? "•" : " ";
    console.log(`  ${mark} ${name.padEnd(16)} ${count}`);
  }
  const missing = EXPECTED.filter((e) => !names.includes(e));
  console.log(
    missing.length
      ? `\n⚠ Missing: ${missing.join(", ")}`
      : "\n✓ All expected collections present.",
  );

  const propozice = await db
    .collection("staticpages")
    .findOne(
      { _id: new mongoose.Types.ObjectId(PROPOZICE_ID) },
      { projection: { title: 1 } },
    );
  console.log(
    propozice
      ? `✓ Propozice doc found: "${String(propozice.title)}"`
      : "⚠ Propozice doc NOT found",
  );

  const users = await db
    .collection("users")
    .find({}, { projection: { password: 1, isAdmin: 1 } })
    .toArray();
  const legacyFormat = /^[0-9a-f]{1024}\.[0-9a-f]{64}$/;
  const parsable = users.filter(
    (u) => typeof u.password === "string" && legacyFormat.test(u.password),
  );
  console.log(
    `✓ Users: ${users.length} (admins: ${users.filter((u) => u.isAdmin === true).length}), ` +
      `legacy "hash.salt" format: ${parsable.length}/${users.length}`,
  );
}

async function main(): Promise<void> {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // env may already be exported in the shell
  }
  const name = envName();
  const uri = process.env[name];
  if (!uri) {
    console.error(`✖ ${name} is not set`);
    process.exit(1);
  }
  const dbName = new URL(uri).pathname.replace(/^\//, "") || "(default)";
  console.log(`Connecting (${name}) to db "${dbName}" …`);

  const start = Date.now();
  try {
    await mongoose.connect(uri, {
      maxPoolSize: 2,
      serverSelectionTimeoutMS: 8000,
    });
    const db = mongoose.connection.db;
    if (!db) throw new Error("No database handle after connect.");
    await db.admin().ping();
    console.log(`✓ Connected and pinged in ${Date.now() - start} ms`);
    await report(db);
  } catch (error) {
    console.error(
      "\n✖ Failed:",
      error instanceof Error ? error.message : error,
    );
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

void main();

// Shared guard for seed scripts: they may only write to a test database unless
// explicitly run against production with `--prod --yes` (cutover, Phase 7).
import mongoose from "mongoose";

export async function connectForSeeding(): Promise<string> {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // env may already be exported
  }
  const prod = process.argv.includes("--prod");
  const uri = prod ? process.env.MONGODB_URI_PROD : process.env.MONGODB_URI;
  if (!uri)
    throw new Error(
      prod ? "MONGODB_URI_PROD is not set" : "MONGODB_URI is not set",
    );

  const dbName = new URL(uri).pathname.replace(/^\//, "");
  if (!dbName.includes("test") && !(prod && process.argv.includes("--yes"))) {
    throw new Error(
      `Refusing to seed "${dbName}": not a test DB (use --prod --yes at cutover).`,
    );
  }
  await mongoose.connect(uri, {
    maxPoolSize: 2,
    serverSelectionTimeoutMS: 8000,
  });
  return dbName;
}

export async function runSeed(
  name: string,
  seed: () => Promise<string>,
): Promise<void> {
  try {
    const dbName = await connectForSeeding();
    const summary = await seed();
    console.log(`✓ ${name} → "${dbName}": ${summary}`);
  } catch (error) {
    console.error(`✖ ${name}:`, error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

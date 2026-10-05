/**
 * Seed the new `results` collection from the legacy frontend's
 * public/data/vysledky.json. Idempotent (upsert by year).
 * Run: npx tsx scripts/seed-results.ts
 */
import { readFileSync } from "node:fs";
import mongoose from "mongoose";
import { z } from "zod";
import { runSeed } from "./seed-guard";

const LEGACY_FILE = "../sayfy-frontend-ts/public/data/vysledky.json";

const legacySchema = z.array(
  z.object({
    rocnik: z.number().int().positive(),
    rok: z.string().regex(/^\d{4}$/),
    url: z.url(),
  }),
);

void runSeed("seed-results", async () => {
  const rows = legacySchema.parse(
    JSON.parse(readFileSync(LEGACY_FILE, "utf8")),
  );
  const results = mongoose.connection.collection("results");
  await results.createIndex({ year: 1 }, { unique: true });
  const now = new Date();
  for (const row of rows) {
    await results.updateOne(
      { year: Number(row.rok) },
      {
        $set: { edition: row.rocnik, url: row.url, updatedAt: now },
        $setOnInsert: { year: Number(row.rok), createdAt: now },
      },
      { upsert: true },
    );
  }
  return `${rows.length} years upserted (${rows.map((r) => r.rok).join(", ")})`;
});

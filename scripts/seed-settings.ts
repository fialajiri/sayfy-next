/**
 * Seed the `settings` singleton. Only fills missing fields, so re-running never
 * overwrites what an admin changed. The race date is fixed (28. 9. 11:00) and
 * not stored. Run: npx tsx scripts/seed-settings.ts
 */
import mongoose from "mongoose";
import { runSeed } from "./seed-guard";

void runSeed("seed-settings", async () => {
  const settings = mongoose.connection.collection<{ _id: string }>("settings");
  const result = await settings.updateOne(
    { _id: "site" },
    {
      $setOnInsert: {
        // Legacy register-button.tsx link; closed after the 2026 race.
        registrationUrl: "https://sportt.cz/register/1544",
        registrationOpen: false,
        editionOverride: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
    { upsert: true },
  );
  return result.upsertedCount ? "created" : "already present (unchanged)";
});

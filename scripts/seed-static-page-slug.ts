/**
 * Add the additive `slug: "propozice"` field to the legacy propozice document
 * (docs/05). Safe alongside the legacy app, which ignores unknown fields.
 * Run: npx tsx scripts/seed-static-page-slug.ts
 */
import mongoose from "mongoose";
import { runSeed } from "./seed-guard";

const PROPOZICE_ID = new mongoose.Types.ObjectId("635c21aea369bc4f74025d04");

void runSeed("seed-static-page-slug", async () => {
  const pages = mongoose.connection.collection("staticpages");
  const result = await pages.updateOne(
    { _id: PROPOZICE_ID },
    { $set: { slug: "propozice" } },
  );
  if (result.matchedCount === 0)
    throw new Error("propozice document not found");
  return result.modifiedCount ? "slug set" : "slug already set";
});

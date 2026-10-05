import "server-only";
import { Types } from "mongoose";
import {
  PROPOZICE_LEGACY_ID,
  PROPOZICE_SLUG,
  type StaticPageRepository,
} from "@/server/domain/static-page";
import { connectToDatabase } from "../connection";
import {
  StaticPageModel,
  type StaticPageDocument,
} from "../models/static-page.model";

export const staticPageRepository: StaticPageRepository = {
  async findBySlug(slug) {
    await connectToDatabase();
    // Until the `slug` field is seeded, propozice is found by its legacy id.
    const fallbackId =
      slug === PROPOZICE_SLUG ? new Types.ObjectId(PROPOZICE_LEGACY_ID) : null;
    const doc = await StaticPageModel.findOne(
      fallbackId ? { $or: [{ slug }, { _id: fallbackId }] } : { slug },
    ).lean<StaticPageDocument>();
    if (!doc) return null;
    return {
      id: doc._id.toString(),
      title: doc.title,
      text: doc.text ?? "",
      updatedAt: doc.updatedAt?.toISOString() ?? null,
    };
  },
};

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

function filterFor(slug: string) {
  // Until the `slug` field is seeded, propozice is found by its legacy id.
  const fallbackId =
    slug === PROPOZICE_SLUG ? new Types.ObjectId(PROPOZICE_LEGACY_ID) : null;
  return fallbackId ? { $or: [{ slug }, { _id: fallbackId }] } : { slug };
}

export const staticPageRepository: StaticPageRepository = {
  async findRecordBySlug(slug) {
    await connectToDatabase();
    const doc = await StaticPageModel.findOne(
      filterFor(slug),
    ).lean<StaticPageDocument>();
    return doc
      ? {
          id: doc._id.toString(),
          title: doc.title,
          text: doc.text ?? "",
          assets: doc.assets ?? [],
          updatedAt: doc.updatedAt?.toISOString() ?? null,
        }
      : null;
  },

  async update(id, input) {
    if (!Types.ObjectId.isValid(id)) return null;
    await connectToDatabase();
    const doc = await StaticPageModel.findByIdAndUpdate(
      id,
      { $set: input },
      { new: true },
    ).lean<StaticPageDocument>();
    return doc
      ? {
          id: doc._id.toString(),
          title: doc.title,
          text: doc.text ?? "",
          assets: doc.assets ?? [],
          updatedAt: doc.updatedAt?.toISOString() ?? null,
        }
      : null;
  },

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

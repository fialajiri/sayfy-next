import "server-only";
import { Types } from "mongoose";
import {
  compareGalleries,
  yearFromTitle,
  type GalleryDetail,
  type GalleryRecord,
  type GalleryRepository,
  type GallerySummary,
} from "@/server/domain/gallery";
import { encodeImageUrl } from "@/server/domain/storage-key";
import { connectToDatabase } from "../connection";
import { GalleryModel, type GalleryDocument } from "../models/gallery.model";

type SummaryRow = Pick<GalleryDocument, "_id" | "title" | "galleryUrl"> & {
  cover: string | null;
  count: number;
};

function toSummary(row: SummaryRow): GallerySummary {
  return {
    id: row._id.toString(),
    slug: row.galleryUrl,
    title: row.title,
    year: yearFromTitle(row.title),
    cover: row.cover ? encodeImageUrl(row.cover) : null,
    count: row.count,
  };
}

function toRecord(doc: GalleryDocument): GalleryRecord {
  return {
    id: doc._id.toString(),
    title: doc.title,
    slug: doc.galleryUrl,
    previousSlugs: doc.previousSlugs ?? [],
    images: doc.images ?? [],
    updatedAt: doc.updatedAt.toISOString(),
  };
}

const valid = (id: string) => Types.ObjectId.isValid(id);
const notId = (exceptId?: string) =>
  exceptId && valid(exceptId)
    ? { _id: { $ne: new Types.ObjectId(exceptId) } }
    : {};

export const galleryRepository: GalleryRepository = {
  // Galleries hold up to ~200 URLs each — return only cover + count for lists.
  async listSummaries() {
    await connectToDatabase();
    const rows = await GalleryModel.aggregate<SummaryRow>([
      {
        $project: {
          title: 1,
          galleryUrl: 1,
          cover: { $ifNull: [{ $first: "$images" }, null] },
          count: { $size: { $ifNull: ["$images", []] } },
        },
      },
    ]);
    return rows.map(toSummary).sort(compareGalleries);
  },

  async findBySlug(slug) {
    await connectToDatabase();
    const doc = await GalleryModel.findOne({
      galleryUrl: slug,
    }).lean<GalleryDocument>();
    if (!doc) return null;
    const images = (doc.images ?? []).map(encodeImageUrl);
    const detail: GalleryDetail = {
      ...toSummary({
        ...doc,
        cover: doc.images?.[0] ?? null,
        count: images.length,
      }),
      images,
    };
    return detail;
  },

  async findCurrentSlug(previousSlug) {
    await connectToDatabase();
    const doc = await GalleryModel.findOne(
      { previousSlugs: previousSlug },
      { galleryUrl: 1 },
    ).lean<Pick<GalleryDocument, "galleryUrl">>();
    return doc?.galleryUrl ?? null;
  },

  async findById(id) {
    if (!valid(id)) return null;
    await connectToDatabase();
    const doc = await GalleryModel.findById(id).lean<GalleryDocument>();
    return doc ? toRecord(doc) : null;
  },

  async titleTaken(title, exceptId) {
    await connectToDatabase();
    return (await GalleryModel.exists({ title, ...notId(exceptId) })) !== null;
  },

  async slugTaken(slug, exceptId) {
    await connectToDatabase();
    return (
      (await GalleryModel.exists({
        $or: [{ galleryUrl: slug }, { previousSlugs: slug }],
        ...notId(exceptId),
      })) !== null
    );
  },

  async create({ title, slug }) {
    await connectToDatabase();
    const doc = await GalleryModel.create({
      title,
      galleryUrl: slug,
      images: [],
      previousSlugs: [],
    });
    return toRecord(doc.toObject());
  },

  async rename(id, { title, slug, previousSlugs }) {
    if (!valid(id)) return null;
    await connectToDatabase();
    const doc = await GalleryModel.findByIdAndUpdate(
      id,
      { $set: { title, galleryUrl: slug, previousSlugs } },
      { new: true },
    ).lean<GalleryDocument>();
    return doc ? toRecord(doc) : null;
  },

  async appendImages(id, urls) {
    if (!valid(id)) return null;
    await connectToDatabase();
    const doc = await GalleryModel.findByIdAndUpdate(
      id,
      { $push: { images: { $each: urls } } },
      { new: true },
    ).lean<GalleryDocument>();
    return doc ? toRecord(doc) : null;
  },

  async setImages(id, images, expectedUpdatedAt) {
    if (!valid(id)) return null;
    await connectToDatabase();
    const doc = await GalleryModel.findOneAndUpdate(
      { _id: id, updatedAt: new Date(expectedUpdatedAt) },
      { $set: { images } },
      { new: true },
    ).lean<GalleryDocument>();
    if (doc) return toRecord(doc);
    return (await GalleryModel.exists({ _id: id })) ? "conflict" : null;
  },

  async delete(id) {
    if (!valid(id)) return null;
    await connectToDatabase();
    const doc =
      await GalleryModel.findByIdAndDelete(id).lean<GalleryDocument>();
    return doc ? toRecord(doc) : null;
  },
};

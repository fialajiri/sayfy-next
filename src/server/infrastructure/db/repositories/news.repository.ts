import "server-only";
import { newsExcerpt } from "@/server/domain/excerpt";
import type {
  NewsDetail,
  NewsRepository,
  NewsSummary,
} from "@/server/domain/news";
import { encodeImageUrl } from "@/server/domain/storage-key";
import { connectToDatabase } from "../connection";
import {
  AktualitaModel,
  type AktualitaDocument,
} from "../models/aktualita.model";

type SummaryFields = Pick<
  AktualitaDocument,
  | "_id"
  | "title"
  | "perex"
  | "text"
  | "mainPhoto"
  | "aktualitaUrl"
  | "createdAt"
>;

// List views need `text` only for the excerpt fallback; projecting it keeps
// one query (the collection is small — dozens of items).
const SUMMARY_PROJECTION = {
  title: 1,
  perex: 1,
  text: 1,
  mainPhoto: 1,
  aktualitaUrl: 1,
  createdAt: 1,
} as const;

export function toNewsSummary(doc: SummaryFields): NewsSummary {
  return {
    id: doc._id.toString(),
    slug: doc.aktualitaUrl,
    title: doc.title,
    excerpt: newsExcerpt(doc.perex, doc.text),
    mainPhoto: encodeImageUrl(doc.mainPhoto),
    createdAt: doc.createdAt.toISOString(),
  };
}

export function toNewsDetail(doc: AktualitaDocument): NewsDetail {
  return {
    ...toNewsSummary(doc),
    text: doc.text ?? "",
    photoGallery: (doc.photoGallery ?? []).map(encodeImageUrl),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export const newsRepository: NewsRepository = {
  async list({ page, pageSize }) {
    await connectToDatabase();
    const total = await AktualitaModel.countDocuments();
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const current = Math.min(Math.max(1, page), pageCount);
    const docs = await AktualitaModel.find({}, SUMMARY_PROJECTION)
      .sort({ createdAt: -1, _id: -1 })
      .skip((current - 1) * pageSize)
      .limit(pageSize)
      .lean<SummaryFields[]>();
    return { items: docs.map(toNewsSummary), page: current, pageCount, total };
  },

  async latest(limit) {
    await connectToDatabase();
    const docs = await AktualitaModel.find({}, SUMMARY_PROJECTION)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .lean<SummaryFields[]>();
    return docs.map(toNewsSummary);
  },

  // Legacy slugs may contain "!", "," and "." — match exactly as stored.
  async findBySlug(slug) {
    await connectToDatabase();
    const doc = await AktualitaModel.findOne({
      aktualitaUrl: slug,
    }).lean<AktualitaDocument>();
    return doc ? toNewsDetail(doc) : null;
  },

  async adjacent(createdAt) {
    await connectToDatabase();
    const at = new Date(createdAt);
    const [newer, older] = await Promise.all([
      AktualitaModel.findOne({ createdAt: { $gt: at } }, SUMMARY_PROJECTION)
        .sort({ createdAt: 1 })
        .lean<SummaryFields>(),
      AktualitaModel.findOne({ createdAt: { $lt: at } }, SUMMARY_PROJECTION)
        .sort({ createdAt: -1 })
        .lean<SummaryFields>(),
    ]);
    return {
      newer: newer ? toNewsSummary(newer) : null,
      older: older ? toNewsSummary(older) : null,
    };
  },

  async recentSlugs(limit) {
    await connectToDatabase();
    const docs = await AktualitaModel.find({}, { aktualitaUrl: 1 })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean<Pick<AktualitaDocument, "aktualitaUrl">[]>();
    return docs.map((doc) => doc.aktualitaUrl);
  },
};

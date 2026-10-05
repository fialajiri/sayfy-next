import "server-only";
import {
  compareGalleries,
  yearFromTitle,
  type GalleryDetail,
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
};

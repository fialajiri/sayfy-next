import "server-only";
import { Types } from "mongoose";
import type { AssetReferenceChecker } from "@/server/domain/news";
import { connectToDatabase } from "../connection";
import { AktualitaModel } from "../models/aktualita.model";
import { GalleryModel } from "../models/gallery.model";
import { StaticPageModel } from "../models/static-page.model";

// Before deleting a file from S3 we make sure no OTHER document still points at
// it (legacy re-uploads could share URLs). Matches raw and encoded variants.
function variants(url: string): string[] {
  const out = new Set([url]);
  try {
    out.add(decodeURI(url));
    out.add(encodeURI(decodeURI(url)));
  } catch {
    // keep the raw form only
  }
  return [...out];
}

export const assetReferenceRepository: AssetReferenceChecker = {
  async stillReferenced(urls, except) {
    if (urls.length === 0) return new Set();
    await connectToDatabase();
    const referenced = new Set<string>();
    const exceptNews =
      except.newsId && Types.ObjectId.isValid(except.newsId)
        ? { _id: { $ne: new Types.ObjectId(except.newsId) } }
        : {};

    for (const url of urls) {
      const forms = variants(url);
      const [news, gallery, page] = await Promise.all([
        AktualitaModel.exists({
          ...exceptNews,
          $or: [
            { mainPhoto: { $in: forms } },
            { photoGallery: { $in: forms } },
            { filesFromEditor: { $in: forms } },
          ],
        }),
        GalleryModel.exists({ images: { $in: forms } }),
        StaticPageModel.exists({
          $or: [
            { assets: { $in: forms } },
            { text: { $regex: escapeRegex(forms[0]) } },
          ],
        }),
      ]);
      if (news || gallery || page) referenced.add(url);
    }
    return referenced;
  },
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

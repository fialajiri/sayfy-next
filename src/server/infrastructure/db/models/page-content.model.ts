import "server-only";
import { Schema, model, models, type Model } from "mongoose";

export type PageContentDocument = {
  /** Page key: "site" | "home" | "sayfy" | "kontakt" | "podpora". */
  _id: string;
  /** Validated by the page's Zod schema on read and write, not by Mongoose. */
  data: unknown;
  updatedAt?: Date;
};

const pageContentSchema = new Schema<PageContentDocument>(
  {
    _id: { type: String, required: true },
    data: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, minimize: false },
);

export const PageContentModel: Model<PageContentDocument> =
  (models.PageContent as Model<PageContentDocument>) ??
  model<PageContentDocument>("PageContent", pageContentSchema, "pagecontents");

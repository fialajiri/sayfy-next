import "server-only";
import { Schema, model, models, type Model, type Types } from "mongoose";

export type StaticPageDocument = {
  _id: Types.ObjectId;
  title: string;
  text?: string;
  assets: string[];
  /** Additive field (docs/05); seeded as "propozice". */
  slug?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

const staticPageSchema = new Schema<StaticPageDocument>(
  {
    title: { type: String, required: true },
    text: { type: String },
    assets: [{ type: String }],
    slug: { type: String, index: true },
  },
  { timestamps: true },
);

export const StaticPageModel: Model<StaticPageDocument> =
  (models.StaticPage as Model<StaticPageDocument>) ??
  model<StaticPageDocument>("StaticPage", staticPageSchema, "staticpages");

import "server-only";
import { Schema, model, models, type Model, type Types } from "mongoose";

export type GalleryDocument = {
  _id: Types.ObjectId;
  title: string;
  images: string[];
  galleryUrl: string;
  createdAt: Date;
  updatedAt: Date;
};

const gallerySchema = new Schema<GalleryDocument>(
  {
    title: { type: String, required: true, unique: true },
    images: [{ type: String }],
    galleryUrl: { type: String, index: true },
  },
  { timestamps: true },
);

export const GalleryModel: Model<GalleryDocument> =
  (models.Gallery as Model<GalleryDocument>) ??
  model<GalleryDocument>("Gallery", gallerySchema, "galleries");

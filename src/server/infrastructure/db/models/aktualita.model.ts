import "server-only";
import { Schema, model, models, type Model, type Types } from "mongoose";

export type AktualitaDocument = {
  _id: Types.ObjectId;
  title: string;
  perex?: string;
  text?: string;
  mainPhoto: string;
  photoGallery: string[];
  filesFromEditor: string[];
  aktualitaUrl: string;
  previousSlugs?: string[];
  createdAt: Date;
  updatedAt: Date;
};

const aktualitaSchema = new Schema<AktualitaDocument>(
  {
    title: { type: String, required: true },
    perex: { type: String },
    text: { type: String },
    mainPhoto: { type: String, required: true },
    photoGallery: [{ type: String }],
    filesFromEditor: [{ type: String }],
    aktualitaUrl: { type: String, index: true },
    previousSlugs: [{ type: String }],
  },
  { timestamps: true },
);

// Pinned: Mongoose's default plural of "Aktualita" — verified in Atlas.
export const AktualitaModel: Model<AktualitaDocument> =
  (models.Aktualita as Model<AktualitaDocument>) ??
  model<AktualitaDocument>("Aktualita", aktualitaSchema, "aktualitas");

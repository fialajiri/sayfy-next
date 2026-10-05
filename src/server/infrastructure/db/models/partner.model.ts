import "server-only";
import { Schema, model, models, type Model, type Types } from "mongoose";

export type PartnerDocument = {
  _id: Types.ObjectId;
  name: string;
  logoUrl: string;
  url?: string;
  order: number;
};

const partnerSchema = new Schema<PartnerDocument>(
  {
    name: { type: String, required: true },
    logoUrl: { type: String, required: true },
    url: { type: String },
    order: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

export const PartnerModel: Model<PartnerDocument> =
  (models.Partner as Model<PartnerDocument>) ??
  model<PartnerDocument>("Partner", partnerSchema, "partners");

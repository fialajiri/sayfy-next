import "server-only";
import { Schema, model, models, type Model, type Types } from "mongoose";

export type RaceResultDocument = {
  _id: Types.ObjectId;
  year: number;
  edition: number;
  url: string;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
};

const raceResultSchema = new Schema<RaceResultDocument>(
  {
    year: { type: Number, required: true, unique: true },
    edition: { type: Number, required: true },
    url: { type: String, required: true },
    note: { type: String },
  },
  { timestamps: true },
);

// New collection (replaces legacy public/data/vysledky.json).
export const RaceResultModel: Model<RaceResultDocument> =
  (models.RaceResult as Model<RaceResultDocument>) ??
  model<RaceResultDocument>("RaceResult", raceResultSchema, "results");

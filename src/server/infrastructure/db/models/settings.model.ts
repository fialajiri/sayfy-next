import "server-only";
import { Schema, model, models, type Model } from "mongoose";

export const SETTINGS_ID = "site";

export type SettingsDocument = {
  _id: string;
  registrationUrl?: string;
  registrationOpen?: boolean;
  editionOverride?: number | null;
  updatedAt?: Date;
};

const settingsSchema = new Schema<SettingsDocument>(
  {
    _id: { type: String, default: SETTINGS_ID },
    registrationUrl: { type: String },
    registrationOpen: { type: Boolean },
    editionOverride: { type: Number, default: null },
  },
  { timestamps: true },
);

// Singleton document { _id: "site" } (docs/05 §New collections).
export const SettingsModel: Model<SettingsDocument> =
  (models.Settings as Model<SettingsDocument>) ??
  model<SettingsDocument>("Settings", settingsSchema, "settings");

import "server-only";
import type {
  SettingsRepository,
  SiteSettingsDto,
} from "@/server/domain/settings";
import { connectToDatabase } from "../connection";
import {
  SETTINGS_ID,
  SettingsModel,
  type SettingsDocument,
} from "../models/settings.model";

export const settingsRepository: SettingsRepository = {
  async find() {
    await connectToDatabase();
    const doc =
      await SettingsModel.findById(SETTINGS_ID).lean<SettingsDocument>();
    if (!doc) return null;
    const stored: Partial<SiteSettingsDto> = {};
    if (typeof doc.registrationUrl === "string")
      stored.registrationUrl = doc.registrationUrl;
    if (typeof doc.registrationOpen === "boolean")
      stored.registrationOpen = doc.registrationOpen;
    if (typeof doc.editionOverride === "number")
      stored.editionOverride = doc.editionOverride;
    return stored;
  },

  async save(input) {
    await connectToDatabase();
    await SettingsModel.updateOne(
      { _id: SETTINGS_ID },
      { $set: input },
      { upsert: true },
    );
  },
};

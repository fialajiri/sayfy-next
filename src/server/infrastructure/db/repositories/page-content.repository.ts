import "server-only";
import type { PageContentRepository } from "@/server/domain/page-content";
import { connectToDatabase } from "../connection";
import {
  PageContentModel,
  type PageContentDocument,
} from "../models/page-content.model";

export const pageContentRepository: PageContentRepository = {
  async findRaw(key) {
    await connectToDatabase();
    const doc =
      await PageContentModel.findById(key).lean<PageContentDocument>();
    return doc?.data ?? null;
  },
};

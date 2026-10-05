import "server-only";
import type { PartnerRepository } from "@/server/domain/partner";
import { encodeImageUrl } from "@/server/domain/storage-key";
import { connectToDatabase } from "../connection";
import { PartnerModel, type PartnerDocument } from "../models/partner.model";

export const partnerRepository: PartnerRepository = {
  async list() {
    await connectToDatabase();
    const docs = await PartnerModel.find()
      .sort({ order: 1, name: 1 })
      .lean<PartnerDocument[]>();
    return docs.map((doc) => ({
      id: doc._id.toString(),
      name: doc.name,
      logoUrl: encodeImageUrl(doc.logoUrl),
      url: doc.url?.trim() || null,
    }));
  },
};

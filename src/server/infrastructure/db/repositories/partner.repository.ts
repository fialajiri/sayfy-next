import "server-only";
import { Types } from "mongoose";
import type { PartnerRecord, PartnerRepository } from "@/server/domain/partner";
import { encodeImageUrl } from "@/server/domain/storage-key";
import { connectToDatabase } from "../connection";
import { PartnerModel, type PartnerDocument } from "../models/partner.model";

function toRecord(doc: PartnerDocument): PartnerRecord {
  return {
    id: doc._id.toString(),
    name: doc.name,
    logoUrl: doc.logoUrl,
    url: doc.url ?? "",
    order: doc.order,
  };
}

const valid = (id: string) => Types.ObjectId.isValid(id);

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

  async listRaw() {
    await connectToDatabase();
    const docs = await PartnerModel.find()
      .sort({ order: 1, name: 1 })
      .lean<PartnerDocument[]>();
    return docs.map(toRecord);
  },

  async findById(id) {
    if (!valid(id)) return null;
    await connectToDatabase();
    const doc = await PartnerModel.findById(id).lean<PartnerDocument>();
    return doc ? toRecord(doc) : null;
  },

  async create(input) {
    await connectToDatabase();
    const last = await PartnerModel.findOne()
      .sort({ order: -1 })
      .lean<PartnerDocument>();
    const doc = await PartnerModel.create({
      ...input,
      order: (last?.order ?? -1) + 1,
    });
    return toRecord(doc.toObject());
  },

  async update(id, input) {
    if (!valid(id)) return null;
    await connectToDatabase();
    const doc = await PartnerModel.findByIdAndUpdate(
      id,
      { $set: input },
      { new: true },
    ).lean<PartnerDocument>();
    return doc ? toRecord(doc) : null;
  },

  async delete(id) {
    if (!valid(id)) return null;
    await connectToDatabase();
    const doc =
      await PartnerModel.findByIdAndDelete(id).lean<PartnerDocument>();
    return doc ? toRecord(doc) : null;
  },

  // One bulkWrite so the order never ends up half-applied.
  async reorder(ids) {
    const valids = ids.filter(valid);
    if (valids.length === 0) return;
    await connectToDatabase();
    await PartnerModel.bulkWrite(
      valids.map((id, order) => ({
        updateOne: {
          filter: { _id: new Types.ObjectId(id) },
          update: { $set: { order } },
        },
      })),
    );
  },
};

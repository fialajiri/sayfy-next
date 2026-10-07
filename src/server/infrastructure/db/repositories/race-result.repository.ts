import "server-only";
import { Types } from "mongoose";
import {
  isEmbeddableResultUrl,
  type RaceResultDto,
  type RaceResultRepository,
} from "@/server/domain/race-result";
import { connectToDatabase } from "../connection";
import {
  RaceResultModel,
  type RaceResultDocument,
} from "../models/race-result.model";

function toDto(doc: RaceResultDocument): RaceResultDto {
  return {
    id: doc._id.toString(),
    year: doc.year,
    edition: doc.edition,
    url: doc.url,
    note: doc.note?.trim() || null,
    embeddable: isEmbeddableResultUrl(doc.url),
  };
}

export const raceResultRepository: RaceResultRepository = {
  async list() {
    await connectToDatabase();
    const docs = await RaceResultModel.find()
      .sort({ year: -1 })
      .lean<RaceResultDocument[]>();
    return docs.map(toDto);
  },

  async findByYear(year) {
    await connectToDatabase();
    const doc = await RaceResultModel.findOne({
      year,
    }).lean<RaceResultDocument>();
    return doc ? toDto(doc) : null;
  },

  async yearTaken(year, exceptId) {
    await connectToDatabase();
    const notId =
      exceptId && Types.ObjectId.isValid(exceptId)
        ? { _id: { $ne: new Types.ObjectId(exceptId) } }
        : {};
    return (await RaceResultModel.exists({ year, ...notId })) !== null;
  },

  async create(input) {
    await connectToDatabase();
    const doc = await RaceResultModel.create(input);
    return toDto(doc.toObject());
  },

  async update(id, input) {
    if (!Types.ObjectId.isValid(id)) return null;
    await connectToDatabase();
    const doc = await RaceResultModel.findByIdAndUpdate(
      id,
      { $set: input },
      { new: true },
    ).lean<RaceResultDocument>();
    return doc ? toDto(doc) : null;
  },

  async delete(id) {
    if (!Types.ObjectId.isValid(id)) return null;
    await connectToDatabase();
    const doc =
      await RaceResultModel.findByIdAndDelete(id).lean<RaceResultDocument>();
    return doc ? toDto(doc) : null;
  },
};

import "server-only";
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
};

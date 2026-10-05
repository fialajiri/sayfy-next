// @vitest-environment node
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { connectToDatabase } from "../connection";
import { AktualitaModel } from "../models/aktualita.model";
import { GalleryModel } from "../models/gallery.model";
import { StaticPageModel } from "../models/static-page.model";
import { galleryRepository } from "./gallery.repository";
import { newsRepository } from "./news.repository";
import { staticPageRepository } from "./static-page.repository";

const S3 = "https://sayfyho-memorial.s3.eu-central-1.amazonaws.com";
let server: MongoMemoryServer;

beforeAll(async () => {
  server = await MongoMemoryServer.create();
  process.env.MONGODB_URI = server.getUri("sayfy-repo-test");
  await connectToDatabase();
}, 120_000);

afterAll(async () => {
  await mongoose.disconnect();
  await server.stop();
});

beforeEach(async () => {
  await Promise.all([
    AktualitaModel.deleteMany({}),
    GalleryModel.deleteMany({}),
    StaticPageModel.deleteMany({}),
  ]);
});

function news(title: string, slug: string, day: number) {
  const createdAt = new Date(Date.UTC(2026, 8, day));
  return {
    title,
    aktualitaUrl: slug,
    mainPhoto: `${S3}/aktuality/${slug}/a b.jpg`,
    text: "<p>Text</p>",
    createdAt,
    updatedAt: createdAt,
  };
}

describe("newsRepository", () => {
  it("lists newest first with pagination and encodes legacy image keys", async () => {
    await AktualitaModel.insertMany(
      [news("A", "a", 1), news("B", "b", 2), news("C", "c", 3)],
      { timestamps: false },
    );
    const page1 = await newsRepository.list({ page: 1, pageSize: 2 });
    expect(page1.items.map((n) => n.slug)).toEqual(["c", "b"]);
    expect(page1).toMatchObject({ page: 1, pageCount: 2, total: 3 });
    expect(page1.items[0].mainPhoto).toBe(`${S3}/aktuality/c/a%20b.jpg`);
    expect((await newsRepository.list({ page: 99, pageSize: 2 })).page).toBe(2);
  });

  it("finds a dirty legacy slug exactly as stored, and its neighbours", async () => {
    await AktualitaModel.insertMany(
      [
        news("Díky, díky!", "diky,-diky!-2023", 2),
        news("X", "x", 1),
        news("Y", "y", 3),
      ],
      { timestamps: false },
    );
    const article = await newsRepository.findBySlug("diky,-diky!-2023");
    expect(article?.title).toBe("Díky, díky!");
    const adjacent = await newsRepository.adjacent(article?.createdAt ?? "");
    expect(adjacent.newer?.slug).toBe("y");
    expect(adjacent.older?.slug).toBe("x");
    expect(await newsRepository.findBySlug("diky-diky-2023")).toBeNull();
  });
});

describe("galleryRepository", () => {
  it("summarises without image arrays, newest year first", async () => {
    await GalleryModel.insertMany([
      {
        title: "2017",
        galleryUrl: "2017",
        images: [`${S3}/2017/1.jpg`, `${S3}/2017/2.jpg`],
      },
      { title: "2026", galleryUrl: "2026", images: [`${S3}/2026/1.jpg`] },
      { title: "2022", galleryUrl: "2022", images: [] },
    ]);
    const summaries = await galleryRepository.listSummaries();
    expect(summaries.map((g) => [g.title, g.count, g.year])).toEqual([
      ["2026", 1, 2026],
      ["2022", 0, 2022],
      ["2017", 2, 2017],
    ]);
    expect(summaries[0].cover).toBe(`${S3}/2026/1.jpg`);
    expect(summaries[1].cover).toBeNull();
  });
});

describe("staticPageRepository", () => {
  it("finds propozice by its legacy id until the slug is seeded, then by slug", async () => {
    const legacyId = new mongoose.Types.ObjectId("635c21aea369bc4f74025d04");
    await StaticPageModel.create({
      _id: legacyId,
      title: "Propozice 2026",
      text: "<p>x</p>",
      assets: [],
    });
    expect((await staticPageRepository.findBySlug("propozice"))?.title).toBe(
      "Propozice 2026",
    );
    await StaticPageModel.updateOne(
      { _id: legacyId },
      { $set: { slug: "propozice" } },
    );
    expect((await staticPageRepository.findBySlug("propozice"))?.id).toBe(
      legacyId.toString(),
    );
    expect(await staticPageRepository.findBySlug("neco-jineho")).toBeNull();
  });
});

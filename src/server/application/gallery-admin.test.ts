import type { GalleryRecord, GalleryRepository } from "@/server/domain/gallery";
import type { AssetReferenceChecker } from "@/server/domain/news";
import {
  appendGalleryImages,
  createGallery,
  deleteGallery,
  renameGallery,
  updateGalleryImages,
  type GalleryAdminDeps,
} from "./gallery-admin";

const HOST = "sayfyho-memorial.s3.eu-central-1.amazonaws.com";
const S3 = `https://${HOST}`;
const legacy = (n: number) => `${S3}/2019/IMG_${n}.jpg`;
const fresh = (n: number) => `${S3}/dev/galerie/2027/${n}.jpg`;

const record: GalleryRecord = {
  id: "g1",
  title: "2019",
  slug: "2019",
  previousSlugs: [],
  images: [legacy(1), legacy(2), legacy(3)],
  updatedAt: "2026-10-07T10:00:00.000Z",
};

function makeDeps(repo: Partial<GalleryRepository> = {}) {
  const calls: string[] = [];
  const galleries = {
    titleTaken: vi.fn(async () => false),
    slugTaken: vi.fn(async () => false),
    findById: vi.fn(async () => record),
    create: vi.fn(async (input: { title: string; slug: string }) => ({
      ...record,
      ...input,
      images: [],
    })),
    rename: vi.fn(
      async (
        _id: string,
        input: Pick<GalleryRecord, "title" | "slug" | "previousSlugs">,
      ) => ({ ...record, ...input }),
    ),
    appendImages: vi.fn(async (_id: string, urls: string[]) => ({
      ...record,
      images: [...record.images, ...urls],
    })),
    setImages: vi.fn(async (_id: string, images: string[]) => {
      calls.push("db");
      return { ...record, images };
    }),
    delete: vi.fn(async () => {
      calls.push("db");
      return record;
    }),
    ...repo,
  } as unknown as GalleryRepository;
  const references: AssetReferenceChecker = {
    stillReferenced: vi.fn(async () => new Set<string>()),
  };
  const storage = {
    deleteMany: vi.fn(async (keys: readonly string[]) => {
      calls.push("s3");
      return { deleted: keys.length, skipped: 0 };
    }),
  };
  const deps: GalleryAdminDeps = {
    galleries,
    references,
    storage,
    origin: { hosts: [HOST], envPrefix: "dev/" },
  };
  return { deps, galleries, storage, calls };
}

describe("gallery admin", () => {
  it("creates with a unique slug and rejects duplicate titles", async () => {
    expect(
      await createGallery(makeDeps().deps, {
        title: "2027",
        updateSlug: false,
      }),
    ).toMatchObject({ ok: true, value: { slug: "2027" } });
    const dup = makeDeps({ titleTaken: vi.fn(async () => true) });
    expect(
      (await createGallery(dup.deps, { title: "2027", updateSlug: false })).ok,
    ).toBe(false);
  });

  it("appends only fresh galerie/ uploads, skipping duplicates", async () => {
    const { deps, galleries } = makeDeps();
    expect(
      (await appendGalleryImages(deps, "g1", { urls: [legacy(9)] })).ok,
    ).toBe(false);
    expect(
      (
        await appendGalleryImages(deps, "g1", {
          urls: [`${S3}/dev/aktuality/x/1.jpg`],
        })
      ).ok,
    ).toBe(false);
    await appendGalleryImages(deps, "g1", { urls: [fresh(1), fresh(1)] });
    expect(vi.mocked(galleries.appendImages).mock.calls[0][1]).toEqual([
      fresh(1),
      fresh(1),
    ]);
  });

  it("reorders/removes only known images and deletes removed ones after the DB write", async () => {
    const { deps, storage, calls } = makeDeps();
    const result = await updateGalleryImages(deps, "g1", {
      images: [legacy(3), legacy(1)],
      expectedUpdatedAt: record.updatedAt,
    });
    expect(result).toMatchObject({
      ok: true,
      value: { images: [legacy(3), legacy(1)] },
    });
    expect(calls).toEqual(["db", "s3"]);
    expect(storage.deleteMany).toHaveBeenCalledWith(["2019/IMG_2.jpg"]);
    const crafted = await updateGalleryImages(makeDeps().deps, "g1", {
      images: [legacy(1), legacy(99)],
      expectedUpdatedAt: record.updatedAt,
    });
    expect(crafted.ok).toBe(false);
  });

  it("reports a concurrent edit as a conflict and deletes nothing", async () => {
    const { deps, storage } = makeDeps({
      setImages: vi.fn(async () => "conflict" as const),
    });
    const result = await updateGalleryImages(deps, "g1", {
      images: [legacy(1)],
      expectedUpdatedAt: record.updatedAt,
    });
    expect(result).toMatchObject({ ok: false, error: { kind: "conflict" } });
    expect(storage.deleteMany).not.toHaveBeenCalled();
  });

  it("renames with a redirect and deletes a gallery with all its photos", async () => {
    const renamed = await renameGallery(makeDeps().deps, "g1", {
      title: "Ročník 2019",
      updateSlug: true,
    });
    expect(renamed).toMatchObject({
      ok: true,
      value: {
        previousSlug: "2019",
        record: { slug: "rocnik-2019", previousSlugs: ["2019"] },
      },
    });
    const { deps, storage, calls } = makeDeps();
    expect((await deleteGallery(deps, "g1")).ok).toBe(true);
    expect(calls).toEqual(["db", "s3"]);
    expect(storage.deleteMany).toHaveBeenCalledWith([
      "2019/IMG_1.jpg",
      "2019/IMG_2.jpg",
      "2019/IMG_3.jpg",
    ]);
  });
});

import type { AssetReferenceChecker } from "@/server/domain/news";
import type {
  StaticPageRecord,
  StaticPageRepository,
} from "@/server/domain/static-page";
import { updateStaticPage } from "./static-page-admin";

const HOST = "sayfyho-memorial.s3.eu-central-1.amazonaws.com";
const S3 = `https://${HOST}`;
const legacyMap = `${S3}/aktuality/propozice/mapy (1).png-dc321589.png`;

// Legacy propozice: images in the HTML but `assets: []` (never maintained).
const current: StaticPageRecord = {
  id: "p1",
  title: "Propozice 2026",
  text: `<p>x</p><img src="${legacyMap}" alt="">`,
  assets: [],
  updatedAt: null,
};

function makeDeps() {
  const pages = {
    findRecordBySlug: vi.fn(async () => current),
    update: vi.fn(
      async (
        _id: string,
        input: { title: string; text: string; assets: string[] },
      ) => ({ ...current, ...input }),
    ),
  } as unknown as StaticPageRepository;
  const references: AssetReferenceChecker = {
    stillReferenced: vi.fn(async () => new Set<string>()),
  };
  const storage = {
    deleteMany: vi.fn(async () => ({ deleted: 1, skipped: 0 })),
  };
  return {
    deps: {
      pages,
      references,
      storage,
      origin: { hosts: [HOST], envPrefix: "dev/" },
      sanitize: (h: string) => h,
    },
    pages,
    storage,
  };
}

describe("updateStaticPage", () => {
  it("keeps legacy images found only in the HTML and records them as assets", async () => {
    const { deps, pages, storage } = makeDeps();
    const result = await updateStaticPage(deps, "propozice", {
      title: "Propozice 2027",
      text: current.text,
    });
    expect(result.ok).toBe(true);
    expect(vi.mocked(pages.update).mock.calls[0][1].assets).toEqual([
      legacyMap,
    ]);
    expect(storage.deleteMany).not.toHaveBeenCalled();
  });

  it("cleans up a legacy image the editor removed (the dev guard decides if S3 really deletes)", async () => {
    const { deps, storage } = makeDeps();
    await updateStaticPage(deps, "propozice", {
      title: "Propozice 2027",
      text: "<p>bez mapy</p>",
    });
    expect(storage.deleteMany).toHaveBeenCalledWith([
      "aktuality/propozice/mapy (1).png-dc321589.png",
    ]);
  });

  it("rejects crafted foreign file references", async () => {
    const { deps, pages } = makeDeps();
    const result = await updateStaticPage(deps, "propozice", {
      title: "P",
      text: `<img src="${S3}/2019/IMG_1.jpg">`,
    });
    expect(result.ok).toBe(false);
    expect(pages.update).not.toHaveBeenCalled();
  });
});

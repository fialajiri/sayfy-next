import type {
  AssetReferenceChecker,
  NewsRecord,
  NewsRepository,
  NewsWrite,
} from "@/server/domain/news";
import {
  createNews,
  deleteNews,
  updateNews,
  type NewsAdminDeps,
} from "./news-admin";

const HOST = "sayfyho-memorial.s3.eu-central-1.amazonaws.com";
const S3 = `https://${HOST}`;
const origin = { hosts: [HOST], envPrefix: "dev/" };
const upload = (name: string) => `${S3}/dev/aktuality/x/${name}`;

const existing: NewsRecord = {
  id: "n1",
  slug: "quick-test",
  previousSlugs: [],
  title: "Vzpomínková vyjížďka 2022",
  perex: "",
  text: `<p>a</p><img src="${S3}/aktuality/old/inline.jpg">`,
  mainPhoto: `${S3}/aktuality/old/main photo.jpg`,
  photoGallery: [`${S3}/aktuality/old/g1.jpg`],
  filesFromEditor: [`${S3}/aktuality/old/inline.jpg`],
  createdAt: "2022-11-09T19:29:11.491Z",
  updatedAt: "2022-11-09T19:29:11.491Z",
};

function makeDeps(
  overrides: Partial<NewsRepository> = {},
  shared: string[] = [],
) {
  const calls: string[] = [];
  const news = {
    titleTaken: vi.fn(async () => false),
    slugTaken: vi.fn(async (slug: string) => slug === "taken"),
    findById: vi.fn(async () => existing),
    create: vi.fn(async (input: NewsWrite) => ({
      ...existing,
      ...input,
      id: "new",
      filesFromEditor: input.filesFromEditor,
    })),
    update: vi.fn(async (_id: string, input: NewsWrite) => {
      calls.push("db-update");
      return { ...existing, ...input };
    }),
    delete: vi.fn(async () => {
      calls.push("db-delete");
      return existing;
    }),
    ...overrides,
  } as unknown as NewsRepository;
  const references: AssetReferenceChecker = {
    stillReferenced: vi.fn(async () => new Set(shared)),
  };
  const storage = {
    deleteMany: vi.fn(async (keys: readonly string[]) => {
      calls.push("s3-delete");
      return { deleted: keys.length, skipped: 0 };
    }),
  };
  const deps: NewsAdminDeps = {
    news,
    references,
    storage,
    origin,
    sanitize: (html) => html.replace(/<script.*?<\/script>/g, ""),
  };
  return { deps, news, storage, calls };
}

const form = (over: Record<string, unknown> = {}) => ({
  title: "Nová trať 2027",
  perex: "",
  text: "<p>Text</p><script>x()</script>",
  mainPhoto: upload("main.jpg"),
  photoGallery: [],
  updateSlug: false,
  ...over,
});

describe("createNews", () => {
  it("sanitizes, derives editor files and generates a unique slug", async () => {
    const { deps, news } = makeDeps({
      slugTaken: vi.fn(async (s: string) => s === "nova-trat-2027"),
    });
    const result = await createNews(
      deps,
      form({ text: `<p>x</p><img src="${upload("inline.jpg")}">` }),
    );
    expect(result).toMatchObject({
      ok: true,
      value: { slug: "nova-trat-2027-2" },
    });
    const saved = vi.mocked(news.create).mock.calls[0][0];
    expect(saved.filesFromEditor).toEqual([upload("inline.jpg")]);
    expect(saved.text).not.toContain("script");
  });

  it("rejects a duplicate title and crafted file URLs", async () => {
    const dup = makeDeps({ titleTaken: vi.fn(async () => true) });
    expect((await createNews(dup.deps, form())).ok).toBe(false);
    const crafted = makeDeps();
    const result = await createNews(
      crafted.deps,
      form({ mainPhoto: `${S3}/2019/IMG_7449.jpg` }),
    );
    expect(result.ok).toBe(false);
    expect(crafted.news.create).not.toHaveBeenCalled();
  });
});

describe("updateNews", () => {
  it("keeps legacy files, deletes only removed ones, and only AFTER the DB write", async () => {
    const { deps, storage, calls } = makeDeps();
    const result = await updateNews(
      deps,
      "n1",
      form({
        title: existing.title,
        mainPhoto: existing.mainPhoto,
        text: "<p>no images</p>",
      }),
    );
    expect(result.ok).toBe(true);
    expect(calls).toEqual(["db-update", "s3-delete"]);
    expect(storage.deleteMany).toHaveBeenCalledWith([
      "aktuality/old/g1.jpg",
      "aktuality/old/inline.jpg",
    ]);
  });

  it("never deletes files another document still references", async () => {
    const { deps, storage } = makeDeps({}, [`${S3}/aktuality/old/g1.jpg`]);
    await updateNews(
      deps,
      "n1",
      form({ title: existing.title, mainPhoto: existing.mainPhoto, text: "" }),
    );
    expect(storage.deleteMany).toHaveBeenCalledWith([
      "aktuality/old/inline.jpg",
    ]);
  });

  it("renames the slug only when asked, keeping the old one as a redirect", async () => {
    const kept = makeDeps();
    expect(
      await updateNews(
        kept.deps,
        "n1",
        form({ title: existing.title, mainPhoto: existing.mainPhoto }),
      ),
    ).toMatchObject({
      ok: true,
      value: { slug: "quick-test", previousSlug: null },
    });
    const renamed = makeDeps();
    const result = await updateNews(
      renamed.deps,
      "n1",
      form({
        title: existing.title,
        mainPhoto: existing.mainPhoto,
        updateSlug: true,
      }),
    );
    expect(result).toMatchObject({
      ok: true,
      value: { slug: "vzpominkova-vyjizdka-2022", previousSlug: "quick-test" },
    });
    expect(
      vi.mocked(renamed.news.update).mock.calls[0][1].previousSlugs,
    ).toEqual(["quick-test"]);
  });

  it("still succeeds when S3 cleanup fails", async () => {
    const { deps, storage } = makeDeps();
    storage.deleteMany.mockRejectedValueOnce(new Error("s3 down"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(
      (
        await updateNews(
          deps,
          "n1",
          form({
            title: existing.title,
            mainPhoto: existing.mainPhoto,
            text: "",
          }),
        )
      ).ok,
    ).toBe(true);
  });
});

describe("deleteNews", () => {
  it("deletes the record, then all its files", async () => {
    const { deps, storage, calls } = makeDeps();
    expect(await deleteNews(deps, "n1")).toEqual({
      ok: true,
      value: { slug: "quick-test" },
    });
    expect(calls).toEqual(["db-delete", "s3-delete"]);
    expect(storage.deleteMany).toHaveBeenCalledWith([
      "aktuality/old/main photo.jpg",
      "aktuality/old/g1.jpg",
      "aktuality/old/inline.jpg",
    ]);
  });
});

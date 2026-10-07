import { DEFAULT_HOME_CONTENT } from "@/schemas/page-content/home";
import type { PartnerRecord, PartnerRepository } from "@/server/domain/partner";
import type { RaceResultRepository } from "@/server/domain/race-result";
import { DEFAULT_SETTINGS } from "@/server/domain/settings";
import {
  fileUrlsOf,
  isBundledFile,
  updatePageContent,
} from "./page-content-admin";
import { deletePartner, reorderPartners, savePartner } from "./partner-admin";
import { saveResult, setRegistrationOpen, updateSettings } from "./race-admin";

const HOST = "sayfyho-memorial.s3.eu-central-1.amazonaws.com";
const S3 = `https://${HOST}`;
const origin = { hosts: [HOST], envPrefix: "dev/" };
const storage = () => ({
  deleteMany: vi.fn(async () => ({ deleted: 1, skipped: 0 })),
});

describe("settings", () => {
  it("validates and saves, and the toggle keeps the other fields", async () => {
    const save = vi.fn(async () => undefined);
    expect(
      (
        await updateSettings(
          { save },
          {
            registrationUrl: "http://x.cz",
            registrationOpen: true,
            editionOverride: null,
          },
        )
      ).ok,
    ).toBe(false);
    const toggled = await setRegistrationOpen(
      {
        save,
        find: async () => ({
          registrationUrl: "https://sportt.cz/register/2000",
        }),
      },
      DEFAULT_SETTINGS,
      true,
    );
    expect(toggled).toEqual({
      ok: true,
      value: {
        ...DEFAULT_SETTINGS,
        registrationUrl: "https://sportt.cz/register/2000",
        registrationOpen: true,
      },
    });
  });
});

describe("results", () => {
  it("rejects a year that already has results", async () => {
    const repo = {
      yearTaken: vi.fn(async () => true),
    } as unknown as RaceResultRepository;
    const result = await saveResult(repo, null, {
      year: 2026,
      edition: 16,
      url: "https://sportt.cz/x",
      note: "",
    });
    expect(result).toMatchObject({
      ok: false,
      error: { fieldErrors: { year: ["Rok už má výsledky."] } },
    });
  });
});

describe("partners", () => {
  const prev: PartnerRecord = {
    id: "a".repeat(24),
    name: "Bombus",
    logoUrl: `${S3}/dev/partners/logos/old.png`,
    url: "",
    order: 0,
  };
  const repo = (overrides: Partial<PartnerRepository> = {}) =>
    ({
      findById: vi.fn(async () => prev),
      update: vi.fn(async (_id: string, input: Partial<PartnerRecord>) => ({
        ...prev,
        ...input,
      })),
      create: vi.fn(async (input: Partial<PartnerRecord>) => ({
        ...prev,
        ...input,
      })),
      delete: vi.fn(async () => prev),
      listRaw: vi.fn(async () => [prev]),
      reorder: vi.fn(async () => undefined),
      ...overrides,
    }) as unknown as PartnerRepository;

  it("accepts own uploads and bundled legacy logos, rejects foreign files", async () => {
    const deps = { partners: repo(), storage: storage(), origin };
    expect(
      (
        await savePartner(deps, null, {
          name: "X",
          logoUrl: "/partners/8-transparent.png",
          url: "",
        })
      ).ok,
    ).toBe(true);
    expect(
      (
        await savePartner(deps, null, {
          name: "X",
          logoUrl: `${S3}/2019/IMG_1.jpg`,
          url: "",
        })
      ).ok,
    ).toBe(false);
  });

  it("deletes the old logo after replacing it — but never a bundled one", async () => {
    const s = storage();
    await savePartner({ partners: repo(), storage: s, origin }, prev.id, {
      name: "Bombus",
      logoUrl: `${S3}/dev/partners/logos/new.png`,
      url: "",
    });
    expect(s.deleteMany).toHaveBeenCalledWith(["dev/partners/logos/old.png"]);
    const bundled = { ...prev, logoUrl: "/partners/8-transparent.png" };
    const s2 = storage();
    await deletePartner(
      {
        partners: repo({ delete: vi.fn(async () => bundled) }),
        storage: s2,
        origin,
      },
      prev.id,
    );
    expect(s2.deleteMany).not.toHaveBeenCalled();
  });

  it("refuses a reorder that doesn't match the current list", async () => {
    const deps = { partners: repo(), storage: storage(), origin };
    expect((await reorderPartners(deps, [prev.id])).ok).toBe(true);
    expect((await reorderPartners(deps, ["b".repeat(24)])).ok).toBe(false);
  });
});

describe("page content", () => {
  const deps = (stored: unknown = null) => {
    const s = storage();
    return {
      s,
      deps: {
        pageContent: {
          findRaw: vi.fn(async () => stored),
          save: vi.fn(async () => undefined),
        },
        storage: s,
        origin,
        sanitize: (h: string) => h.replace(/<script.*?<\/script>/g, ""),
      },
    };
  };

  it("recognises bundled default files, including subfolders, but never traversal", () => {
    expect(isBundledFile("/images/sayfy/sayfy-profile.png")).toBe(true);
    expect(isBundledFile("/video/hero.mp4")).toBe(true);
    expect(isBundledFile("/images/../.env")).toBe(false);
    expect(isBundledFile("/api/uploads/presign")).toBe(false);
  });

  it("collects every file URL in a content object", () => {
    expect(fileUrlsOf(DEFAULT_HOME_CONTENT)).toEqual([
      "/video/hero.mp4",
      "/video/hero.webm",
      "/video/hero-poster.jpg",
      "/images/sayfy/sayfy-profile.png",
    ]);
  });

  it("accepts bundled defaults and own uploads, rejects foreign files", async () => {
    const { deps: d } = deps();
    expect((await updatePageContent(d, "home", DEFAULT_HOME_CONTENT)).ok).toBe(
      true,
    );
    const foreign = structuredClone(DEFAULT_HOME_CONTENT);
    foreign.memorial.portrait.url = `${S3}/2019/IMG_1.jpg`;
    expect((await updatePageContent(d, "home", foreign)).ok).toBe(false);
  });

  it("deletes a replaced own upload, never a bundled default", async () => {
    const own = structuredClone(DEFAULT_HOME_CONTENT);
    own.memorial.portrait.url = `${S3}/dev/stranky/home/a.jpg`;
    const { deps: d, s } = deps(own);
    await updatePageContent(d, "home", DEFAULT_HOME_CONTENT); // back to the bundled portrait
    expect(s.deleteMany).toHaveBeenCalledWith(["dev/stranky/home/a.jpg"]);
    const { deps: d2, s: s2 } = deps(DEFAULT_HOME_CONTENT);
    const replaced = structuredClone(DEFAULT_HOME_CONTENT);
    replaced.memorial.portrait.url = `${S3}/dev/stranky/home/b.jpg`;
    await updatePageContent(d2, "home", replaced);
    expect(s2.deleteMany).not.toHaveBeenCalled();
  });

  it("sanitizes rich fields (Sayfy chapters) before saving", async () => {
    const { deps: d } = deps();
    const { DEFAULT_SAYFY_CONTENT } =
      await import("@/schemas/page-content/sayfy");
    const input = structuredClone(DEFAULT_SAYFY_CONTENT);
    input.chapters[0].body = "<p>a</p><script>x()</script>";
    const result = await updatePageContent(d, "sayfy", input);
    expect(result.ok && result.value.chapters[0].body).toBe("<p>a</p>");
  });
});

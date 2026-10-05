import { DEFAULT_HOME_CONTENT } from "@/schemas/page-content/home";
import { DEFAULT_SITE_CONTENT } from "@/schemas/page-content/site";
import type { PageContentRepository } from "@/server/domain/page-content";
import { getPageContent } from "./page-content";

function repoReturning(value: unknown): PageContentRepository {
  return { findRaw: async () => value };
}

describe("getPageContent", () => {
  it("returns the legacy defaults when nothing is stored", async () => {
    expect(await getPageContent(repoReturning(null), "home")).toEqual(
      DEFAULT_HOME_CONTENT,
    );
  });

  it("merges stored top-level fields over the defaults", async () => {
    const site = await getPageContent(
      repoReturning({ footerTagline: "Na shledanou v Hrobu" }),
      "site",
    );
    expect(site.footerTagline).toBe("Na shledanou v Hrobu");
    expect(site.seo).toEqual(DEFAULT_SITE_CONTENT.seo);
  });

  it("falls back to defaults when the stored shape is invalid", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const site = await getPageContent(
      repoReturning({ facebookUrl: "javascript:alert(1)" }),
      "site",
    );
    expect(site).toEqual(DEFAULT_SITE_CONTENT);
  });

  it("falls back to defaults when the database fails", async () => {
    const failing: PageContentRepository = {
      findRaw: async () => {
        throw new Error("down");
      },
    };
    expect(await getPageContent(failing, "home")).toEqual(DEFAULT_HOME_CONTENT);
  });
});

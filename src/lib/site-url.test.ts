import { siteUrl } from "./site-url";

describe("siteUrl", () => {
  it("prefers NEXT_PUBLIC_SITE_URL", () => {
    expect(
      siteUrl({
        NEXT_PUBLIC_SITE_URL: "https://www.sayfy.cz",
        VERCEL_PROJECT_PRODUCTION_URL: "x.vercel.app",
      }).origin,
    ).toBe("https://www.sayfy.cz");
  });

  it("falls back to the Vercel production URL, then localhost", () => {
    expect(
      siteUrl({ VERCEL_PROJECT_PRODUCTION_URL: "sayfy-next.vercel.app" })
        .origin,
    ).toBe("https://sayfy-next.vercel.app");
    expect(siteUrl({ NEXT_PUBLIC_SITE_URL: "not a url" }).origin).toBe(
      "http://localhost:3000",
    );
    expect(siteUrl({}).origin).toBe("http://localhost:3000");
  });
});

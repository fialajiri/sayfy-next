import { siteUrl } from "./site-url";

describe("siteUrl", () => {
  const original = process.env.NEXT_PUBLIC_SITE_URL;
  afterEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = original;
  });

  it("uses NEXT_PUBLIC_SITE_URL when valid", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://www.sayfy.cz";
    expect(siteUrl().origin).toBe("https://www.sayfy.cz");
  });

  it("falls back to localhost when missing or invalid", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "not a url";
    expect(siteUrl().origin).toBe("http://localhost:3000");
  });
});

import { slugify, uniqueSlug } from "./slug";

describe("slugify", () => {
  it("strips Czech diacritics and punctuation", () => {
    expect(slugify("Závod zná svého vítěze!")).toBe("zavod-zna-sveho-viteze");
    expect(slugify("Díky, díky! 2023")).toBe("diky-diky-2023");
    expect(slugify("Projížďka tratí 21. 9. v 17.17!")).toBe(
      "projizdka-trati-21-9-v-17-17",
    );
  });

  it("never returns an empty slug", () => {
    expect(slugify("!!!")).toBe("polozka");
  });

  it("caps the length without a trailing dash", () => {
    const slug = slugify("a ".repeat(100));
    expect(slug.length).toBeLessThanOrEqual(80);
    expect(slug.endsWith("-")).toBe(false);
  });
});

describe("uniqueSlug", () => {
  it("returns the base when free", async () => {
    expect(await uniqueSlug("Fotoreport", async () => false)).toBe(
      "fotoreport",
    );
  });

  it("appends the first free numeric suffix", async () => {
    const taken = new Set(["fotoreport", "fotoreport-2"]);
    expect(await uniqueSlug("Fotoreport", async (c) => taken.has(c))).toBe(
      "fotoreport-3",
    );
  });
});

import { presignRequestSchema } from "./upload";

const jpg = { name: "a.jpg", type: "image/jpeg", size: 1000 };

describe("presignRequestSchema", () => {
  it("accepts images for content prefixes and documents for soubory", () => {
    expect(
      presignRequestSchema.safeParse({
        prefix: "aktuality",
        scope: "nova-trat",
        files: [jpg],
      }).success,
    ).toBe(true);
    expect(
      presignRequestSchema.safeParse({
        prefix: "soubory",
        scope: "propozice",
        files: [{ name: "p.pdf", type: "application/pdf", size: 5e6 }],
      }).success,
    ).toBe(true);
  });

  it("rejects wrong MIME per prefix, oversize, path-like scopes and too many files", () => {
    const bad = [
      {
        prefix: "aktuality",
        scope: "x",
        files: [{ name: "p.pdf", type: "application/pdf", size: 10 }],
      },
      {
        prefix: "soubory",
        scope: "x",
        files: [{ name: "x.html", type: "text/html", size: 10 }],
      },
      {
        prefix: "galerie",
        scope: "2027",
        files: [{ ...jpg, size: 16 * 1024 * 1024 }],
      },
      { prefix: "galerie", scope: "../etc", files: [jpg] },
      {
        prefix: "galerie",
        scope: "2027",
        files: Array.from({ length: 51 }, () => jpg),
      },
      { prefix: "unknown", scope: "x", files: [jpg] },
    ];
    for (const body of bad)
      expect(
        presignRequestSchema.safeParse(body).success,
        JSON.stringify(body).slice(0, 80),
      ).toBe(false);
  });
});

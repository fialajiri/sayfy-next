import { excerpt, htmlToText, newsExcerpt } from "./excerpt";

describe("htmlToText", () => {
  it("strips tags, decodes common entities and collapses whitespace", () => {
    expect(
      htmlToText(
        "<p>Ahoj&nbsp;<strong>světe</strong></p><p>Druhý&amp;třetí</p>",
      ),
    ).toBe("Ahoj světe Druhý&třetí");
  });
});

describe("excerpt", () => {
  it("returns short text unchanged", () => {
    expect(excerpt("<p>Krátký text.</p>")).toBe("Krátký text.");
  });

  it("cuts at a word boundary and adds an ellipsis", () => {
    const result = excerpt(`<p>${"slovo ".repeat(60)}</p>`, 40);
    expect(result.endsWith("…")).toBe(true);
    expect(result.length).toBeLessThanOrEqual(41);
    expect(result).not.toMatch(/ …$/);
  });
});

describe("newsExcerpt", () => {
  it("prefers perex and falls back to the body", () => {
    expect(newsExcerpt("<p>Perex</p>", "<p>Text</p>")).toBe("Perex");
    expect(newsExcerpt("", "<p>Text</p>")).toBe("Text");
    expect(newsExcerpt(undefined, undefined)).toBe("");
  });
});

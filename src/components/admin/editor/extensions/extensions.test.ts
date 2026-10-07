import { Editor } from "@tiptap/react";
import fixture from "../legacy-content.fixture.json";
import { editorExtensions } from "./index";

function roundTrip(html: string): string {
  const editor = new Editor({ extensions: editorExtensions(), content: html });
  const out = editor.getHTML();
  editor.destroy();
  return out;
}

function hrefs(html: string): string[] {
  return [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]).sort();
}

function imageSrcs(html: string): string[] {
  return [...html.matchAll(/<img[^>]*src="([^"]+)"/g)].map((m) => m[1]).sort();
}

function text(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

describe("legacy content round-trip (docs/08 §A3)", () => {
  const samples = [
    { slug: "propozice", html: fixture.propozice },
    ...fixture.news,
  ];

  it.each(samples)("$slug keeps all text, links and images", ({ html }) => {
    const out = roundTrip(html);
    expect(text(out)).toBe(text(html));
    expect(hrefs(out)).toEqual(hrefs(html));
    expect(imageSrcs(out)).toEqual(imageSrcs(html));
  });

  it("turns legacy images into figures and drops the placeholder alt", () => {
    const out = roundTrip(fixture.propozice);
    expect(out).toContain('<figure data-align="center" data-width="100">');
    expect(out).not.toContain("an image from editor");
  });

  it("preserves headings, lists and emphasis from the propozice", () => {
    const out = roundTrip(fixture.propozice);
    for (const tag of ["<h3", "<h4", "<ul", "<li", "<strong", "<em"])
      expect(out).toContain(tag);
  });
});

describe("new nodes", () => {
  it("serialises figures with caption, size and alignment", () => {
    const html = `<figure data-align="left" data-width="50"><img src="https://x/a.jpg" alt="Trať"><figcaption>Mapa</figcaption></figure>`;
    expect(roundTrip(html)).toBe(html);
  });

  it("parses legacy attachments as chips", () => {
    const out = roundTrip(
      `<p>Viz <a class="editor--file" href="https://x/propozice.pdf" target="_blank">propozice.pdf</a></p>`,
    );
    expect(out).toContain("data-attachment");
    expect(out).toContain('href="https://x/propozice.pdf"');
    expect(out).toContain(">propozice.pdf</a>");
  });

  it("keeps callouts, tables, alignment, sub/sup, colour and highlight", () => {
    const html =
      `<div data-callout="warning"><p>Pozor</p></div>` +
      `<table><tbody><tr><th colspan="1" rowspan="1"><p>A</p></th></tr><tr><td colspan="1" rowspan="1"><p>1</p></td></tr></tbody></table>` +
      `<p style="text-align: center;">H<sub>2</sub>O x<sup>2</sup> <span style="color: rgb(27, 122, 87);">zelená</span> <mark>důležité</mark></p>`;
    const out = roundTrip(html);
    for (const part of [
      'data-callout="warning"',
      "<table",
      "<th",
      "text-align: center",
      "<sub>2</sub>",
      "<sup>2</sup>",
      "color: rgb(27, 122, 87)",
      "<mark>",
    ]) {
      expect(out).toContain(part);
    }
  });
});

import { Editor } from "@tiptap/react";
import { sanitizeRichText } from "@/lib/sanitize-html";
import { editorExtensions } from "./index";

// Content is sanitized on save; whatever the sanitizer strips is lost on the
// next edit. Every editor feature must survive editor → sanitize → editor.
function cycle(html: string): string {
  const first = new Editor({ extensions: editorExtensions(), content: html });
  const saved = sanitizeRichText(first.getHTML());
  first.destroy();
  const second = new Editor({ extensions: editorExtensions(), content: saved });
  const out = second.getHTML();
  second.destroy();
  return out;
}

const S3 = "https://sayfyho-memorial.s3.eu-central-1.amazonaws.com";

describe("editor → sanitize → editor", () => {
  it.each([
    [
      "figure",
      `<figure data-align="right" data-width="33"><img src="${S3}/dev/a.jpg" alt="Trať"><figcaption>Mapa</figcaption></figure>`,
      [
        'data-align="right"',
        'data-width="33"',
        "<figcaption>Mapa</figcaption>",
        'alt="Trať"',
      ],
    ],
    [
      "attachment",
      `<p><a data-attachment="" data-size="1,2 MB" data-mime="application/pdf" href="${S3}/dev/soubory/x/p.pdf">propozice.pdf</a></p>`,
      ["data-attachment", 'data-size="1,2 MB"', ">propozice.pdf<"],
    ],
    [
      "callout",
      `<div data-callout="warning"><p>Pozor</p></div>`,
      ['data-callout="warning"'],
    ],
    [
      "youtube",
      `<div data-youtube-video=""><iframe src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"></iframe></div>`,
      ["youtube-nocookie.com/embed/dQw4w9WgXcQ"],
    ],
    [
      "palette colour",
      `<p><span style="color: #1b7a57">zelená</span></p>`,
      ["color: rgb(27, 122, 87)"],
    ],
    ["highlight", `<p><mark>důležité</mark></p>`, ["<mark>"]],
    [
      "alignment",
      `<p style="text-align: justify;">x</p>`,
      ["text-align: justify"],
    ],
    [
      "table",
      `<table><tbody><tr><th colspan="2" rowspan="1"><p>A</p></th></tr></tbody></table>`,
      ['colspan="2"', "<th"],
    ],
    [
      "link in new tab",
      `<p><a href="https://mapy.cz" target="_blank">mapa</a></p>`,
      ['href="https://mapy.cz"', 'target="_blank"'],
    ],
  ])("%s survives", (_name, html, expected) => {
    const out = cycle(html);
    for (const part of expected) expect(out).toContain(part);
  });
});

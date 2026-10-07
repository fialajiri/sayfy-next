import sanitizeHtml from "sanitize-html";

// Rich-text HTML (news, propozice, page blocks) is sanitized on write AND on
// render — legacy rows were stored raw. One config for both (docs/08 §A3).
// sanitize-html (parser-based) rather than DOMPurify/jsdom, which breaks in
// Turbopack server bundles (lesson from zive-teplice).

const IMAGE_HOSTS = [
  "sayfyho-memorial.s3.eu-central-1.amazonaws.com",
  "d3o6i10cj9gxf0.cloudfront.net",
];
const YOUTUBE_EMBED =
  /^https:\/\/www\.youtube-nocookie\.com\/embed\/[\w-]{6,20}(\?[\w=&-]*)?$/;
// Text colours are limited to the brand palette (docs/08 §A2): ink, sayfy-700,
// gold-700, danger. The editor normalises colours to rgb(), so accept both forms.
const PALETTE_COLOR =
  /^(#(141a17|1b7a57|7a5b0f|c2410c)|rgb\(\s*(20\s*,\s*26\s*,\s*23|27\s*,\s*122\s*,\s*87|122\s*,\s*91\s*,\s*15|194\s*,\s*65\s*,\s*12)\s*\))$/i;
const TEXT_ALIGN = /^(left|center|right|justify)$/;

export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p",
      "br",
      "hr",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "s",
      "sub",
      "sup",
      "mark",
      "span",
      "h2",
      "h3",
      "h4",
      "ul",
      "ol",
      "li",
      "blockquote",
      "a",
      "img",
      "figure",
      "figcaption",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "colgroup",
      "col",
      "div",
      "iframe",
    ],
    allowedAttributes: {
      a: [
        "href",
        "target",
        "rel",
        "download",
        "data-attachment",
        "data-size",
        "data-mime",
      ],
      img: ["src", "alt", "width", "height"],
      figure: ["data-align", "data-width"],
      div: ["data-callout", "data-youtube-video"],
      th: ["colspan", "rowspan", "colwidth"],
      td: ["colspan", "rowspan", "colwidth"],
      col: ["span"],
      iframe: ["src", "title", "allowfullscreen"],
      h2: ["id"],
      h3: ["id"],
      h4: ["id"],
      "*": ["style"],
    },
    allowedStyles: {
      "*": { "text-align": [TEXT_ALIGN], color: [PALETTE_COLOR] },
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: { img: ["https"] },
    allowedIframeHostnames: ["www.youtube-nocookie.com"],
    exclusiveFilter: (frame) =>
      (frame.tag === "iframe" &&
        !YOUTUBE_EMBED.test(frame.attribs.src ?? "")) ||
      (frame.tag === "img" && !isOurImage(frame.attribs.src ?? "")),
    transformTags: {
      // New tabs never get window.opener; external links are never followed by crawlers.
      a: (tagName, attribs) => ({
        tagName,
        attribs:
          attribs.target === "_blank"
            ? { ...attribs, rel: "noopener noreferrer nofollow" }
            : { ...attribs, rel: attribs.rel ?? "" },
      }),
    },
    disallowedTagsMode: "discard",
  });
}

function isOurImage(src: string): boolean {
  if (!URL.canParse(src)) return false;
  const url = new URL(src);
  return url.protocol === "https:" && IMAGE_HOSTS.includes(url.hostname);
}

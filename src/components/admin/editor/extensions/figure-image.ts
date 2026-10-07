import Image from "@tiptap/extension-image";
import { mergeAttributes } from "@tiptap/react";

export const IMAGE_WIDTHS = ["33", "50", "75", "100"] as const;
export const IMAGE_ALIGNS = ["left", "center", "right"] as const;
export type ImageWidth = (typeof IMAGE_WIDTHS)[number];
export type ImageAlign = (typeof IMAGE_ALIGNS)[number];

// The legacy editor gave every image this placeholder alt — treat it as missing.
const LEGACY_PLACEHOLDER_ALT = "an image from editor";

function pick<T extends string>(
  value: string | null,
  allowed: readonly T[],
  fallback: T,
): T {
  return value !== null && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

/**
 * Image with alt, caption, width preset (% of the text column) and alignment,
 * serialised as <figure data-align data-width><img><figcaption>. Percent widths
 * stay responsive (drag-resize would store fixed pixels — docs/08 §A2 note).
 * Parses legacy bare <img> tags so old content opens unchanged.
 */
export const FigureImage = Image.extend({
  name: "image",

  addAttributes() {
    return {
      ...this.parent?.(),
      alt: {
        default: "",
        parseHTML: (el) => {
          const alt =
            el.querySelector("img")?.getAttribute("alt") ??
            el.getAttribute("alt") ??
            "";
          return alt === LEGACY_PLACEHOLDER_ALT ? "" : alt;
        },
      },
      caption: {
        default: "",
        parseHTML: (el) => el.querySelector("figcaption")?.textContent ?? "",
      },
      width: {
        default: "100",
        parseHTML: (el) =>
          pick(el.getAttribute("data-width"), IMAGE_WIDTHS, "100"),
      },
      align: {
        default: "center",
        parseHTML: (el) =>
          pick(el.getAttribute("data-align"), IMAGE_ALIGNS, "center"),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "figure",
        getAttrs: (el) => {
          const src = el.querySelector("img")?.getAttribute("src");
          return src ? { src } : false;
        },
      },
      { tag: "img[src]" },
    ];
  },

  renderHTML({ node }) {
    const { src, alt, caption, width, align } = node.attrs as Record<
      string,
      string
    >;
    const img = ["img", mergeAttributes({ src, alt })] as const;
    return [
      "figure",
      { "data-align": align, "data-width": width },
      img,
      ...(caption ? [["figcaption", {}, caption] as const] : []),
    ];
  },
});

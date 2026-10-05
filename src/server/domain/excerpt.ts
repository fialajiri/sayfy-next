// Plain-text excerpt for cards and meta descriptions. Prefers the legacy
// `perex` when present, otherwise derives one from the HTML body.

const ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
};

export function htmlToText(html: string): string {
  return html
    .replace(/<(br|\/p|\/li|\/h[1-6])\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&[a-z#0-9]+;/gi, (entity) => ENTITIES[entity] ?? " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function excerpt(html: string, maxLength = 160): string {
  const text = htmlToText(html);
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength + 1);
  const lastSpace = cut.lastIndexOf(" ");
  const trimmed = (
    lastSpace > maxLength * 0.6
      ? cut.slice(0, lastSpace)
      : cut.slice(0, maxLength)
  ).replace(/[\s,.;:–-]+$/, "");
  return `${trimmed}…`;
}

export function newsExcerpt(
  perex: string | undefined,
  text: string | undefined,
): string {
  const fromPerex = excerpt(perex ?? "");
  return fromPerex || excerpt(text ?? "");
}

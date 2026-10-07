// Which stored files a piece of content references, and which may be deleted
// after an edit (docs/03 §4, docs/08 §A3). Pure — HTML is scanned with regexes
// on SANITIZED markup (attribute quoting is normalised by sanitize-html).
import { storageKeyFromUrl } from "./storage-key";

const IMG_SRC = /<img\b[^>]*\bsrc="([^"]+)"/gi;
// New attachment chips carry data-attachment; legacy ones used class="editor--file".
const ATTACHMENT_HREF =
  /<a\b(?=[^>]*(?:\bdata-attachment\b|\beditor--file\b))[^>]*\bhref="([^"]+)"/gi;

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/** Image + attachment URLs on our own hosts referenced by an HTML body. */
export function extractAssetUrls(
  html: string,
  allowedHosts: readonly string[],
): string[] {
  const urls = new Set<string>();
  for (const pattern of [IMG_SRC, ATTACHMENT_HREF]) {
    for (const match of html.matchAll(pattern)) {
      const url = decodeEntities(match[1]);
      if (storageKeyFromUrl(url, allowedHosts)) urls.add(url);
    }
  }
  return [...urls];
}

/** URLs present before an edit but no longer referenced after it. */
export function removedAssets(
  before: readonly string[],
  after: readonly string[],
): string[] {
  const kept = new Set(after.map(canonical));
  return [...new Set(before)].filter((url) => !kept.has(canonical(url)));
}

// Legacy rows store unencoded URLs; compare on the decoded key so
// "a b.jpg" and "a%20b.jpg" count as the same object.
function canonical(url: string): string {
  if (!URL.canParse(url)) return url;
  const parsed = new URL(url);
  try {
    return `${parsed.host}/${decodeURIComponent(parsed.pathname.replace(/^\//, ""))}`;
  } catch {
    return url;
  }
}

export type UploadOrigin = { hosts: readonly string[]; envPrefix: string };

/** True when `url` is a file uploaded through our presign route under one of `prefixes`. */
export function isOwnUpload(
  url: string,
  origin: UploadOrigin,
  prefixes: readonly string[],
): boolean {
  const key = storageKeyFromUrl(url, origin.hosts);
  return (
    key !== null &&
    prefixes.some((prefix) => key.startsWith(`${origin.envPrefix}${prefix}/`))
  );
}

/**
 * A URL in submitted content is acceptable if it was already on the record
 * (legacy files keep working) or is a fresh upload under an allowed prefix.
 * Anything else is a crafted reference and is rejected.
 */
export function unacceptableUrls(
  submitted: readonly string[],
  previously: readonly string[],
  origin: UploadOrigin,
  prefixes: readonly string[],
): string[] {
  const known = new Set(previously.map(canonical));
  return submitted.filter(
    (url) => !known.has(canonical(url)) && !isOwnUpload(url, origin, prefixes),
  );
}

export function storageKeys(
  urls: readonly string[],
  hosts: readonly string[],
): string[] {
  return urls
    .map((url) => storageKeyFromUrl(url, hosts))
    .filter((key): key is string => key !== null);
}

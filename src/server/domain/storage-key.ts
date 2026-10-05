// Maps a stored full image URL back to its S3 object key — only for our own
// hosts, so a crafted URL can never make us reference or delete a foreign
// object. Relative URLs (bundled /public defaults) have no key.

export function storageKeyFromUrl(
  url: string,
  allowedHosts: readonly string[],
): string | null {
  if (!URL.canParse(url)) return null;
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" || !allowedHosts.includes(parsed.hostname))
    return null;

  const path = parsed.pathname.replace(/^\/+/, "");
  if (!path) return null;
  try {
    return decodeURIComponent(path);
  } catch {
    return null; // malformed %-escape
  }
}

// Legacy keys contain spaces and brackets ("mapy (1).png-…"); encode each
// path segment so the URL is valid for next/image and the browser.
export function encodeImageUrl(url: string): string {
  if (!URL.canParse(url)) return url;
  const parsed = new URL(url);
  parsed.pathname = parsed.pathname
    .split("/")
    .map((segment) => encodeURIComponent(safeDecode(segment)))
    .join("/");
  return parsed.toString();
}

function safeDecode(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

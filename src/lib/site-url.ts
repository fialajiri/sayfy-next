// Canonical origin of the site. Production: https://www.sayfy.cz (the apex
// redirects to www). Used for metadataBase, canonical URLs, OG and sitemap.
const FALLBACK_SITE_URL = "http://localhost:3000";

export function siteUrl(): URL {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw || !URL.canParse(raw)) return new URL(FALLBACK_SITE_URL);
  return new URL(raw);
}

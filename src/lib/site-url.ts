// Canonical origin of the site. Production: https://www.sayfy.cz (the apex
// redirects to www). Used for metadataBase, canonical URLs, OG and sitemap.
// Falls back to the Vercel project's production URL, then localhost.
const FALLBACK_SITE_URL = "http://localhost:3000";

export function siteUrl(
  env: Record<string, string | undefined> = process.env,
): URL {
  const explicit = env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit && URL.canParse(explicit)) return new URL(explicit);
  const vercel = env.VERCEL_PROJECT_PRODUCTION_URL?.trim(); // host only, set by Vercel
  if (vercel && URL.canParse(`https://${vercel}`))
    return new URL(`https://${vercel}`);
  return new URL(FALLBACK_SITE_URL);
}

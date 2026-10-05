export type NavItem = { href: string; label: string };

// Public sections — URLs identical to the legacy site (docs/04 route map).
export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/", label: "Domů" },
  { href: "/sayfy", label: "Sayfy" },
  { href: "/aktuality", label: "Aktuality" },
  { href: "/propozice", label: "Propozice" },
  { href: "/vysledky", label: "Výsledky" },
  { href: "/fotogalerie", label: "Fotogalerie" },
  { href: "/kontakt", label: "Kontakt" },
  { href: "/podpora", label: "Podpora" },
];

export type SocialLinks = { facebookUrl: string; instagramUrl: string };

// Legacy values; become admin-editable via pagecontent "site" in Phase 1/5.
export const DEFAULT_SOCIAL_LINKS: SocialLinks = {
  facebookUrl: "https://www.facebook.com/sayfyhomemorial",
  instagramUrl: "https://www.instagram.com/sayfyhomemorial/",
};

export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

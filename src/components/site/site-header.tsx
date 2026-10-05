import { MobileNav } from "./mobile-nav";
import { NavLinks } from "./nav-links";
import type { SocialLinks as SocialLinksData } from "./navigation";
import { SiteLogo } from "./site-logo";
import { SocialLinks } from "./social-links";

// Always on the dark "asphalt" surface. A transparent-over-hero variant is
// part of the Phase 6 motion layer (docs/06 §9).
export function SiteHeader({ socialLinks }: { socialLinks: SocialLinksData }) {
  return (
    <header className="dark bg-asphalt-950 text-foreground sticky top-0 z-40 border-b border-white/5">
      <div className="max-w-wide mx-auto flex h-18 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <SiteLogo />
        <nav aria-label="Hlavní navigace" className="hidden lg:block">
          <NavLinks />
        </nav>
        <div className="flex items-center gap-1">
          <SocialLinks links={socialLinks} className="hidden sm:flex" />
          <MobileNav socialLinks={socialLinks} />
        </div>
      </div>
    </header>
  );
}

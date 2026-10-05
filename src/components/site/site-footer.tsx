import Image from "next/image";
import Link from "next/link";
import codeFactory from "@/../public/brand/codefactory.svg";
import { NAV_ITEMS, type SocialLinks as SocialLinksData } from "./navigation";
import { SocialLinks } from "./social-links";
import { ThemeToggle } from "./theme-toggle";

type SiteFooterProps = { socialLinks: SocialLinksData; tagline: string };

function TaglineHeading({ tagline }: { tagline: string }) {
  const words = tagline.split(" ");
  const accent = words.length > 2 ? words.slice(-2).join(" ") : "";
  const lead = accent ? words.slice(0, -2).join(" ") : tagline;
  return (
    <p className="font-display-upper text-display-2 italic">
      {lead} {accent && <span className="text-signal">{accent}</span>}
    </p>
  );
}

export function SiteFooter({ socialLinks, tagline }: SiteFooterProps) {
  return (
    <footer className="dark bg-asphalt-950 text-foreground mt-auto">
      <div className="checker-band" aria-hidden="true" />
      <div className="max-w-wide mx-auto grid gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1fr_auto] lg:px-8">
        <div className="space-y-4">
          <TaglineHeading tagline={tagline} />
          <SocialLinks links={socialLinks} className="-ml-3" />
        </div>
        <nav aria-label="Patička">
          <ul className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="max-w-wide text-muted-foreground mx-auto flex flex-wrap items-center justify-between gap-4 border-t border-white/5 px-4 py-6 text-sm sm:px-6 lg:px-8">
        <p>© {new Date().getFullYear()} Sayfyho Memorial</p>
        <ThemeToggle />
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="flex items-center gap-2 whitespace-nowrap">
            created by
            <Image
              src={codeFactory}
              alt="codeFactory s.r.o."
              className="h-5 w-auto brightness-0 invert"
            />
          </span>
          <a
            href="mailto:main@codefactory.cz"
            className="hover:text-foreground"
          >
            main@codefactory.cz
          </a>
          <Link href="/prihlaseni" className="hover:text-foreground">
            Administrace
          </Link>
        </div>
      </div>
    </footer>
  );
}

import { AdminShortcut } from "@/components/site/admin-shortcut";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { getPageContent } from "@/server/application/page-content";
import { container } from "@/server/container";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const site = await getPageContent(container.pageContent, "site");
  const socialLinks = {
    facebookUrl: site.facebookUrl,
    instagramUrl: site.instagramUrl,
  };
  return (
    <>
      <a
        href="#obsah"
        className="bg-signal text-ink sr-only z-50 rounded-lg px-4 py-2 font-medium focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Přeskočit na obsah
      </a>
      <SiteHeader socialLinks={socialLinks} />
      <main id="obsah" className="flex-1">
        {children}
      </main>
      <SiteFooter socialLinks={socialLinks} tagline={site.footerTagline} />
      <AdminShortcut />
    </>
  );
}

import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <a
        href="#obsah"
        className="bg-signal text-ink sr-only z-50 rounded-lg px-4 py-2 font-medium focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Přeskočit na obsah
      </a>
      <SiteHeader />
      <main id="obsah" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}

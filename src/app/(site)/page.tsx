import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { FactsStrip } from "@/components/site/facts-strip";
import { Hero } from "@/components/site/hero";
import { MemorialBand } from "@/components/site/memorial-band";
import { NewsCard } from "@/components/site/news-card";
import { NewsRail, NewsRailItem } from "@/components/site/news-rail";
import { PartnerWall } from "@/components/site/partner-wall";
import { PhotoGrid } from "@/components/site/photo-grid";
import { RegistrationCta } from "@/components/site/registration-cta";
import { ResultBibLink } from "@/components/site/result-bib-link";
import { SectionHeading } from "@/components/site/section-heading";
import { latestGallery } from "@/server/application/galleries";
import { latestNews } from "@/server/application/news";
import { getPageContent } from "@/server/application/page-content";
import { listPartners } from "@/server/application/partners";
import { getRaceOverview } from "@/server/application/race";
import { container } from "@/server/container";

export const revalidate = 300;

export default async function HomePage() {
  const [content, sayfy, race, news, gallery, partners] = await Promise.all([
    getPageContent(container.pageContent, "home"),
    getPageContent(container.pageContent, "sayfy"),
    getRaceOverview(
      { settings: container.settings, results: container.results },
      new Date(),
    ),
    latestNews(container.news, 6),
    latestGallery(container.galleries),
    listPartners(container.partners),
  ]);

  return (
    <>
      <Hero content={content.hero} race={race} />
      <FactsStrip facts={content.facts} />

      {news.length > 0 && (
        <section
          aria-labelledby="home-news"
          className="max-w-wide mx-auto space-y-8 px-4 py-16 sm:px-6 lg:px-8 lg:py-24"
        >
          <SectionHeading
            id="home-news"
            title={content.sections.newsTitle}
            href="/aktuality"
          />
          <NewsRail label={content.sections.newsTitle}>
            {news.map((item) => (
              <NewsRailItem key={item.id}>
                <NewsCard news={item} />
              </NewsRailItem>
            ))}
          </NewsRail>
        </section>
      )}

      <MemorialBand content={content.memorial} sayfy={sayfy} />

      {race.results.length > 0 && (
        <section
          aria-labelledby="home-results"
          className="dark bg-asphalt-950 text-foreground"
        >
          <div className="checker-band" aria-hidden="true" />
          <div className="max-w-wide mx-auto space-y-8 px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
            <SectionHeading
              id="home-results"
              title={content.sections.resultsTitle}
              href="/vysledky"
            />
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {race.results.slice(0, 4).map((result) => (
                <li key={result.id}>
                  <ResultBibLink result={result} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {gallery && (
        <section
          aria-labelledby="home-gallery"
          className="max-w-wide mx-auto space-y-8 px-4 py-16 sm:px-6 lg:px-8 lg:py-24"
        >
          <SectionHeading
            id="home-gallery"
            title={`${content.sections.galleryTitle} ${gallery.title}`}
            href={`/fotogalerie/${encodeURIComponent(gallery.slug)}`}
            linkLabel="Celá galerie"
          />
          <PhotoGrid
            photos={gallery.images.slice(0, 10).map((src, i) => ({
              src,
              alt: `${gallery.title} — fotografie ${i + 1}`,
            }))}
            className="lg:grid-cols-5"
          />
        </section>
      )}

      {partners.length > 0 && (
        <section
          aria-labelledby="home-partners"
          className="max-w-wide mx-auto space-y-6 px-4 pb-20 sm:px-6 lg:px-8"
        >
          <SectionHeading
            id="home-partners"
            title={content.sections.partnersTitle}
            href="/podpora"
          />
          <PartnerWall partners={partners} compact />
        </section>
      )}

      <section
        aria-labelledby="home-finish"
        className="bg-sayfy-900 text-white"
      >
        <div className="max-w-wide mx-auto flex flex-col items-start gap-6 px-4 py-16 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <h2
              id="home-finish"
              className="font-display-upper text-display-1 italic"
            >
              {content.finishCta.title}
            </h2>
            <p className="mt-2 text-lg text-white/80">
              {content.finishCta.text}
            </p>
          </div>
          {race.registration.open ? (
            <RegistrationCta open url={race.registration.url} />
          ) : (
            <Link
              href={content.hero.secondaryCta.href}
              className="inline-flex items-center gap-2 text-lg font-semibold underline underline-offset-4"
            >
              {content.hero.secondaryCta.label}
              <ArrowRightIcon className="size-5" aria-hidden="true" />
            </Link>
          )}
        </div>
      </section>
    </>
  );
}

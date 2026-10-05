import type { Metadata } from "next";
import { NewsCard } from "@/components/site/news-card";
import { PageHeader } from "@/components/site/page-header";
import { PageNav } from "@/components/site/page-nav";
import { listNews } from "@/server/application/news";
import { container } from "@/server/container";

export const metadata: Metadata = {
  title: "Aktuality",
  description: "Aktuality a novinky k cyklistickému závodu Sayfyho Memorial",
  alternates: { canonical: "/aktuality" },
};

export const revalidate = 300;

function pageFrom(value: string | string[] | undefined): number {
  const page = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export default async function AktualityPage({
  searchParams,
}: PageProps<"/aktuality">) {
  const page = pageFrom((await searchParams).strana);
  const result = await listNews(container.news, page);
  if (!result.ok) throw new Error(result.error.message);

  const { items, pageCount } = result.value;
  const [featured, ...rest] = items;
  const showFeatured = result.value.page === 1 && featured;

  return (
    <>
      <PageHeader kicker="Novinky ze závodu" title="Aktuality" />
      <div className="max-w-wide mx-auto space-y-12 px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {items.length === 0 && (
          <p className="text-muted-foreground text-lg">
            Zatím žádné aktuality.
          </p>
        )}
        {showFeatured && (
          <NewsCard news={featured} variant="featured" priority />
        )}
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(showFeatured ? rest : items).map((news) => (
            <li key={news.id}>
              <NewsCard news={news} />
            </li>
          ))}
        </ul>
        <PageNav
          page={result.value.page}
          pageCount={pageCount}
          hrefFor={(p) => (p === 1 ? "/aktuality" : `/aktuality?strana=${p}`)}
        />
      </div>
    </>
  );
}

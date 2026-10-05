import { ArrowUpRightIcon, ImagesIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/site/page-header";
import { getResult, listResults } from "@/server/application/race";
import { container } from "@/server/container";

export const revalidate = 3600;

export async function generateStaticParams(): Promise<{ rok: string }[]> {
  const results = await listResults(container.results);
  return results.ok ? results.value.map((r) => ({ rok: String(r.year) })) : [];
}

async function load(params: PageProps<"/vysledky/[rok]">["params"]) {
  const result = await getResult(container.results, Number((await params).rok));
  if (!result.ok && result.error.kind === "not_found") notFound();
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
}

export async function generateMetadata({
  params,
}: PageProps<"/vysledky/[rok]">): Promise<Metadata> {
  const result = await load(params);
  return {
    title: `Výsledky ${result.year}`,
    description: `Výsledky ${result.edition}. ročníku cyklistického závodu Sayfyho Memorial (${result.year})`,
    alternates: { canonical: `/vysledky/${result.year}` },
  };
}

export default async function VysledekPage({
  params,
}: PageProps<"/vysledky/[rok]">) {
  const result = await load(params);
  const gallery = (
    await container.galleries.listSummaries().catch(() => [])
  ).find((g) => g.year === result.year);

  return (
    <>
      <PageHeader
        kicker={`${result.edition}. ročník`}
        title={`Výsledky ${result.year}`}
        lead={result.note}
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "signal", size: "xl" })}
          >
            Otevřít na sportt.cz
            <ArrowUpRightIcon data-icon="inline-end" aria-hidden="true" />
            <span className="sr-only">(otevře se v novém okně)</span>
          </a>
          {gallery && (
            <Link
              href={`/fotogalerie/${encodeURIComponent(gallery.slug)}`}
              className={buttonVariants({ variant: "outline", size: "xl" })}
            >
              <ImagesIcon data-icon="inline-start" aria-hidden="true" />
              Fotogalerie {result.year}
            </Link>
          )}
        </div>
      </PageHeader>
      {result.embeddable && (
        <div className="max-w-wide mx-auto px-4 py-10 sm:px-6 lg:px-8">
          <iframe
            src={result.url}
            title={`Výsledková listina ${result.year}`}
            loading="lazy"
            className="h-[80vh] w-full rounded-2xl border bg-white"
          />
        </div>
      )}
    </>
  );
}

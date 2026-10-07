import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { PhotoGrid } from "@/components/site/photo-grid";
import { RichText } from "@/components/site/rich-text";
import { formatDateLong, isoDay } from "@/lib/dates";
import { decodeSlugParam, getNewsArticle } from "@/server/application/news";
import { container } from "@/server/container";
import type { NewsSummary } from "@/server/domain/news";

export const revalidate = 300;

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const slugs = await container.news.recentSlugs(20).catch(() => []);
  return slugs.map((slug) => ({ slug }));
}

async function load(params: PageProps<"/aktuality/[slug]">["params"]) {
  const result = await getNewsArticle(
    container.news,
    decodeSlugParam((await params).slug),
  );
  if (!result.ok && result.error.kind === "not_found") notFound();
  if (!result.ok) throw new Error(result.error.message);
  if (result.value.kind === "moved")
    permanentRedirect(`/aktuality/${encodeURIComponent(result.value.slug)}`);
  return result.value.value;
}

export async function generateMetadata({
  params,
}: PageProps<"/aktuality/[slug]">): Promise<Metadata> {
  const { article } = await load(params);
  return {
    title: article.title,
    description: article.excerpt || undefined,
    alternates: { canonical: `/aktuality/${encodeURIComponent(article.slug)}` },
    openGraph: {
      type: "article",
      publishedTime: article.createdAt,
      images: [{ url: article.mainPhoto }],
    },
  };
}

// Legacy perex is HTML ("<p>…</p>"), new ones are plain text.
function Perex({ html }: { html: string }) {
  const isHtml = /<[a-z][\s\S]*>/i.test(html);
  return isHtml ? (
    <RichText html={html} className="mx-auto text-xl font-medium" />
  ) : (
    <p className="mx-auto max-w-prose text-xl font-medium">{html}</p>
  );
}

function AdjacentLink({
  news,
  direction,
}: {
  news: NewsSummary | null;
  direction: "newer" | "older";
}) {
  if (!news) return <span />;
  const older = direction === "older";
  return (
    <Link
      href={`/aktuality/${encodeURIComponent(news.slug)}`}
      className={`group hover:bg-muted flex max-w-sm flex-col gap-1 rounded-xl border p-4 ${older ? "items-end text-right" : ""}`}
    >
      <span className="text-muted-foreground inline-flex items-center gap-1 text-xs tracking-wider uppercase">
        {!older && <ArrowLeftIcon className="size-3.5" aria-hidden="true" />}
        {older ? "Starší" : "Novější"}
        {older && <ArrowRightIcon className="size-3.5" aria-hidden="true" />}
      </span>
      <span className="font-semibold">{news.title}</span>
    </Link>
  );
}

export default async function AktualitaPage({
  params,
}: PageProps<"/aktuality/[slug]">) {
  const { article, adjacent } = await load(params);
  const photos = article.photoGallery.map((src, i) => ({
    src,
    alt: `${article.title} — fotografie ${i + 1}`,
  }));

  return (
    <article>
      <header className="dark bg-asphalt-950 text-foreground relative isolate overflow-hidden">
        <Image
          src={article.mainPhoto}
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover opacity-45"
        />
        <div
          className="from-asphalt-950 absolute inset-0 -z-10 bg-gradient-to-t to-transparent"
          aria-hidden="true"
        />
        <div className="max-w-content mx-auto flex min-h-[55svh] flex-col justify-end gap-4 px-4 pt-24 pb-12 sm:px-6 lg:px-8">
          <Link href="/aktuality" className="kicker w-fit hover:underline">
            Aktuality
          </Link>
          <h1 className="font-display-upper text-display-1 italic">
            {article.title}
          </h1>
          <time
            dateTime={isoDay(article.createdAt)}
            className="font-mono text-sm tracking-wider text-white/75"
          >
            {formatDateLong(article.createdAt)}
          </time>
        </div>
      </header>

      <div className="max-w-content mx-auto space-y-12 px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {article.perex && <Perex html={article.perex} />}
        <div className="bg-muted relative mx-auto aspect-[3/2] max-w-prose overflow-hidden rounded-2xl border">
          <Image
            src={article.mainPhoto}
            alt={article.title}
            fill
            sizes="(min-width: 768px) 68ch, 100vw"
            className="object-contain"
          />
        </div>
        <RichText html={article.text} className="mx-auto" />
        {photos.length > 0 && (
          <section aria-labelledby="article-photos" className="space-y-5">
            <h2 id="article-photos" className="kicker">
              Fotogalerie
            </h2>
            <PhotoGrid photos={photos} />
          </section>
        )}
        <nav
          aria-label="Další aktuality"
          className="flex flex-wrap justify-between gap-4 border-t pt-8"
        >
          <AdjacentLink news={adjacent.newer} direction="newer" />
          <AdjacentLink news={adjacent.older} direction="older" />
        </nav>
      </div>
    </article>
  );
}

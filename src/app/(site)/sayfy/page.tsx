import { ArrowRightIcon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PhotoGrid } from "@/components/site/photo-grid";
import { RichText } from "@/components/site/rich-text";
import { cn } from "@/lib/utils";
import { getPageContent } from "@/server/application/page-content";
import { container } from "@/server/container";

export const metadata: Metadata = {
  title: "David „Sayfy“ Seifrt",
  description: "Stránka věnovaná památce Davida „Sayfyho“ Seifrta",
  alternates: { canonical: "/sayfy" },
};

export const revalidate = 3600;

// The memorial register (docs/06 §1): paper, generous space, no signal colour.
export default async function SayfyPage() {
  const sayfy = await getPageContent(container.pageContent, "sayfy");
  const [first, ...rest] = sayfy.name.split(" ");

  return (
    <div className="light bg-paper text-foreground">
      <header className="max-w-content mx-auto grid items-center gap-10 px-4 pt-16 pb-12 sm:px-6 md:grid-cols-[auto_1fr] lg:px-8 lg:pt-24">
        <div className="bg-paper-2 relative mx-auto size-56 overflow-hidden rounded-full sm:size-72">
          <Image
            src={sayfy.portrait.url}
            alt={sayfy.portrait.alt}
            fill
            priority
            sizes="288px"
            className="object-cover"
          />
        </div>
        <div className="space-y-4 text-center md:text-left">
          <h1 className="font-display-upper text-display-1">
            {first}{" "}
            {sayfy.nickname && (
              <span className="text-sayfy-700">„{sayfy.nickname}“</span>
            )}{" "}
            {rest.join(" ")}
          </h1>
          <p className="text-muted-foreground font-mono tracking-wider">
            <span aria-label="narozen">✱</span> {sayfy.born} ·{" "}
            <span aria-label="zemřel">✝</span> {sayfy.died}
          </p>
        </div>
      </header>

      <ol className="max-w-content mx-auto space-y-16 px-4 py-12 sm:px-6 lg:space-y-24 lg:px-8">
        {sayfy.chapters.map((chapter, i) => (
          <li
            key={chapter.id}
            className="grid items-center gap-8 md:grid-cols-2 md:gap-14"
          >
            <div className={cn("space-y-4", i % 2 === 1 && "md:order-2")}>
              <h2 className="font-display-upper text-display-3 text-sayfy-700">
                {chapter.title}
              </h2>
              <RichText html={chapter.body} />
            </div>
            {chapter.image && (
              <div className="bg-paper-2 relative aspect-[4/3] overflow-hidden rounded-2xl">
                <Image
                  src={chapter.image.url}
                  alt={chapter.image.alt}
                  fill
                  sizes="(min-width: 768px) 36rem, 100vw"
                  className="object-contain"
                />
              </div>
            )}
          </li>
        ))}
      </ol>

      <figure className="bg-paper-2 px-4 py-20 text-center sm:px-6 lg:py-28">
        <blockquote className="font-display-upper text-display-1 text-sayfy-700 mx-auto max-w-3xl italic">
          „{sayfy.quote.text}“
        </blockquote>
        {sayfy.quote.attribution && (
          <figcaption className="text-muted-foreground mt-4 font-mono text-sm tracking-wider">
            — {sayfy.quote.attribution}
          </figcaption>
        )}
      </figure>

      {sayfy.photos.length > 0 && (
        <section
          aria-labelledby="sayfy-photos"
          className="max-w-wide mx-auto space-y-6 px-4 py-16 sm:px-6 lg:px-8"
        >
          <h2 id="sayfy-photos" className="kicker">
            Fotografie
          </h2>
          <PhotoGrid
            photos={sayfy.photos.map((p) => ({ src: p.url, alt: p.alt }))}
          />
        </section>
      )}

      <section className="max-w-content mx-auto px-4 pb-20 text-center sm:px-6 lg:px-8">
        <p className="text-lg">{sayfy.closing.text}</p>
        <Link
          href={sayfy.closing.link.href}
          className="text-primary mt-3 inline-flex items-center gap-1.5 font-semibold hover:underline"
        >
          {sayfy.closing.link.label}
          <ArrowRightIcon className="size-4" aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}

import { ArrowRightIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { HomeContent } from "@/schemas/page-content/home";
import type { SayfyContent } from "@/schemas/page-content/sayfy";

type MemorialBandProps = {
  content: HomeContent["memorial"];
  sayfy: Pick<SayfyContent, "name" | "nickname" | "born" | "died">;
};

// The quiet "memorial" register (docs/06 §1): paper, no signal colour.
export function MemorialBand({ content, sayfy }: MemorialBandProps) {
  return (
    <section
      aria-labelledby="memorial-title"
      className="light bg-paper-2 text-foreground"
    >
      <div className="max-w-content mx-auto grid items-center gap-10 px-4 py-20 sm:px-6 md:grid-cols-[auto_1fr] lg:px-8 lg:py-28">
        <div className="relative mx-auto size-48 overflow-hidden rounded-full sm:size-60">
          <Image
            src={content.portrait.url}
            alt={content.portrait.alt}
            fill
            sizes="240px"
            className="object-cover"
          />
        </div>
        <div className="space-y-5 text-center md:text-left">
          <blockquote
            id="memorial-title"
            className="font-display-upper text-display-1 text-sayfy-700 italic"
          >
            „{content.quote}“
          </blockquote>
          <p className="text-muted-foreground font-mono text-sm tracking-wider">
            {sayfy.name}
            {sayfy.nickname && ` „${sayfy.nickname}“`} · ✱ {sayfy.born} · ✝{" "}
            {sayfy.died}
          </p>
          <Link
            href="/sayfy"
            className="text-primary inline-flex items-center gap-1.5 font-medium hover:underline"
          >
            {content.linkLabel}
            <ArrowRightIcon className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

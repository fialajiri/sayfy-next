import Image from "next/image";
import Link from "next/link";
import { formatDate, isoDay } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { NewsSummary } from "@/server/domain/news";

type NewsCardProps = {
  news: NewsSummary;
  variant?: "default" | "featured";
  priority?: boolean;
  className?: string;
};

export function NewsCard({
  news,
  variant = "default",
  priority,
  className,
}: NewsCardProps) {
  const featured = variant === "featured";
  return (
    <article
      className={cn(
        "group bg-card text-card-foreground relative flex h-full flex-col overflow-hidden rounded-2xl border",
        featured && "lg:grid lg:grid-cols-[1.4fr_1fr]",
        className,
      )}
    >
      <div
        className={cn(
          "bg-muted relative aspect-[4/3] overflow-hidden",
          featured && "lg:aspect-auto lg:min-h-96",
        )}
      >
        <Image
          src={news.mainPhoto}
          alt=""
          fill
          priority={priority}
          sizes={
            featured
              ? "(min-width: 1024px) 55vw, 100vw"
              : "(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 90vw"
          }
          className="object-cover transition-transform duration-(--duration-reveal) ease-(--ease-race) group-hover:scale-[1.03]"
        />
      </div>
      <div
        className={cn(
          "flex flex-1 flex-col gap-3 p-5",
          featured && "lg:justify-center lg:p-10",
        )}
      >
        <time
          dateTime={isoDay(news.createdAt)}
          className="text-muted-foreground font-mono text-xs tracking-wider"
        >
          {formatDate(news.createdAt)}
        </time>
        <h3
          className={cn(
            "font-display leading-tight font-bold uppercase",
            featured ? "text-display-2" : "text-2xl",
          )}
        >
          <Link
            href={`/aktuality/${encodeURIComponent(news.slug)}`}
            className="after:absolute after:inset-0"
          >
            {news.title}
          </Link>
        </h3>
        {news.excerpt && (
          <p
            className={cn(
              "text-muted-foreground",
              featured ? "text-lg" : "line-clamp-3 text-sm",
            )}
          >
            {news.excerpt}
          </p>
        )}
      </div>
    </article>
  );
}

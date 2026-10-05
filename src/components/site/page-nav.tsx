import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type PageNavProps = {
  page: number;
  pageCount: number;
  hrefFor: (page: number) => string;
};

// Simple prev/next + numbers pagination with real links (works without JS).
export function PageNav({ page, pageCount, hrefFor }: PageNavProps) {
  if (pageCount <= 1) return null;
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);
  const item =
    "inline-flex size-11 items-center justify-center rounded-full border text-sm font-medium";
  return (
    <nav
      aria-label="Stránkování"
      className="flex flex-wrap items-center justify-center gap-2"
    >
      {page > 1 && (
        <Link href={hrefFor(page - 1)} className={item} rel="prev">
          <ChevronLeftIcon className="size-4" aria-hidden="true" />
          <span className="sr-only">Předchozí stránka</span>
        </Link>
      )}
      {pages.map((p) => (
        <Link
          key={p}
          href={hrefFor(p)}
          aria-current={p === page ? "page" : undefined}
          className={cn(
            item,
            p === page
              ? "bg-primary text-primary-foreground border-primary"
              : "hover:bg-muted",
          )}
        >
          {p}
        </Link>
      ))}
      {page < pageCount && (
        <Link href={hrefFor(page + 1)} className={item} rel="next">
          <ChevronRightIcon className="size-4" aria-hidden="true" />
          <span className="sr-only">Další stránka</span>
        </Link>
      )}
    </nav>
  );
}

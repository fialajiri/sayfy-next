import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";

type SectionHeadingProps = {
  id: string;
  title: string;
  href?: string;
  linkLabel?: string;
};

export function SectionHeading({
  id,
  title,
  href,
  linkLabel = "Zobrazit vše",
}: SectionHeadingProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <h2 id={id} className="kicker">
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          className="text-primary inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
        >
          {linkLabel}
          <ArrowRightIcon className="size-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

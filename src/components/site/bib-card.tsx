import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BibCardProps = {
  /** The big race-bib number, e.g. the ročník "16". */
  number: string;
  /** Line under the number, e.g. the year "2026". */
  caption: ReactNode;
  className?: string;
};

// Race-bib motif (docs/06 §5): off-white card, sponsor strip, safety-pin dots.
export function BibCard({ number, caption, className }: BibCardProps) {
  return (
    <div
      className={cn(
        "bib flex flex-col items-center justify-center px-8 pt-6 pb-7",
        className,
      )}
    >
      <span className="font-display text-7xl leading-none font-extrabold tracking-tight italic tabular-nums">
        {number}
      </span>
      <span className="text-ink-muted mt-2 font-mono text-sm tracking-widest uppercase">
        {caption}
      </span>
    </div>
  );
}

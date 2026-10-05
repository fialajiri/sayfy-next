import Link from "next/link";
import type { RaceResultDto } from "@/server/domain/race-result";
import { BibCard } from "./bib-card";

export function ResultBibLink({ result }: { result: RaceResultDto }) {
  return (
    <Link
      href={`/vysledky/${result.year}`}
      className="group block rounded-xl transition-transform duration-(--duration-ui) ease-(--ease-race) hover:-translate-y-1 hover:-rotate-1"
    >
      <BibCard
        number={String(result.edition)}
        caption={`${result.year} · výsledky`}
      />
      <span className="sr-only">
        {result.edition}. ročník, {result.year}
      </span>
    </Link>
  );
}

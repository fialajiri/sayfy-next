import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { HomeContent } from "@/schemas/page-content/home";
import type { RaceOverview } from "@/server/application/race";
import { HeroVideo } from "./hero-video";
import { RaceCountdown } from "./race-countdown";
import { RegistrationCta } from "./registration-cta";

type HeroProps = { content: HomeContent["hero"]; race: RaceOverview };

function fillTokens(text: string, race: RaceOverview): string {
  return text
    .replaceAll("{edition}", race.edition === null ? "" : String(race.edition))
    .replaceAll("{year}", String(race.status.year))
    .replace(/^\.\s*/, "");
}

function RaceState({ race }: { race: RaceOverview }) {
  const { status } = race;
  if (status.kind === "upcoming") {
    return (
      <RaceCountdown
        startIso={status.start.toISOString()}
        daysLeft={status.daysLeft}
      />
    );
  }
  if (status.kind === "raceDay") {
    return (
      <p className="font-display-upper text-signal text-display-2 italic">
        Dnes závodíme! Start v 11:00
      </p>
    );
  }
  const result = race.results.find((r) => r.year === status.year);
  return (
    <p className="text-lg">
      Díky, že jste jeli!{" "}
      {result && (
        <Link
          href={`/vysledky/${status.year}`}
          className="text-signal font-semibold underline underline-offset-4"
        >
          Výsledky {status.year}
        </Link>
      )}
    </p>
  );
}

export function Hero({ content, race }: HeroProps) {
  const [first, ...rest] = content.title.split(" ");
  return (
    <section
      aria-labelledby="hero-title"
      className="dark text-foreground bg-asphalt-950 relative isolate overflow-hidden"
    >
      <HeroVideo
        mp4Url={content.video.mp4Url}
        webmUrl={content.video.webmUrl}
        posterUrl={content.video.poster.url}
      />
      <div
        className="from-asphalt-950 via-asphalt-950/70 to-asphalt-950/30 absolute inset-0 -z-0 bg-gradient-to-t"
        aria-hidden="true"
      />
      <div className="max-w-wide relative mx-auto flex min-h-[88svh] flex-col justify-end gap-8 px-4 pt-28 pb-16 sm:px-6 lg:px-8 lg:pb-20">
        <p className="kicker">{fillTokens(content.kicker, race)}</p>
        <h1 id="hero-title" className="font-display-upper text-hero italic">
          {first}
          {rest.length > 0 && (
            <>
              <br />
              <span className="text-sayfy-300">{rest.join(" ")}</span>
            </>
          )}
        </h1>
        {content.subtitle && (
          <p className="max-w-xl text-lg text-white/80 sm:text-xl">
            {content.subtitle}
          </p>
        )}
        <RaceState race={race} />
        <div className="flex flex-wrap gap-3">
          <RegistrationCta
            open={race.registration.open}
            url={race.registration.url}
          />
          <Link
            href={content.secondaryCta.href}
            className={cn(
              buttonVariants({ variant: "outline", size: "xl" }),
              "border-white/30 bg-transparent",
            )}
          >
            {content.secondaryCta.label}
            <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

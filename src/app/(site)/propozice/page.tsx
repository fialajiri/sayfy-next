import { CalendarIcon, ClockIcon, FlagIcon, MapPinIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/site/page-header";
import { RegistrationCta } from "@/components/site/registration-cta";
import { RichText } from "@/components/site/rich-text";
import { getRaceOverview } from "@/server/application/race";
import { getPropozice } from "@/server/application/static-pages";
import { container } from "@/server/container";
import type { RaceOverview } from "@/server/application/race";

export const metadata: Metadata = {
  title: "Propozice",
  description:
    "Propozice, kategorie a startovné cyklistického závodu Sayfyho Memorial",
  alternates: { canonical: "/propozice" },
};

export const revalidate = 300;

function QuickFacts({ race }: { race: RaceOverview }) {
  const lastResult = race.results[0];
  const rows = [
    {
      Icon: CalendarIcon,
      label: "Termín",
      value: `28. září ${race.status.year}`,
    },
    { Icon: ClockIcon, label: "Start", value: "11:00" },
    { Icon: MapPinIcon, label: "Místo", value: "Královské město Hrob" },
    ...(race.edition
      ? [{ Icon: FlagIcon, label: "Ročník", value: `${race.edition}.` }]
      : []),
  ];
  return (
    <aside
      aria-label="Základní informace"
      className="bg-card space-y-5 rounded-2xl border p-6 lg:sticky lg:top-24"
    >
      <dl className="space-y-4">
        {rows.map(({ Icon, label, value }) => (
          <div key={label} className="flex items-start gap-3">
            <Icon
              className="text-sayfy-700 mt-0.5 size-5 shrink-0"
              aria-hidden="true"
            />
            <div>
              <dt className="text-muted-foreground text-xs tracking-wider uppercase">
                {label}
              </dt>
              <dd className="font-semibold">{value}</dd>
            </div>
          </div>
        ))}
      </dl>
      <RegistrationCta
        open={race.registration.open}
        url={race.registration.url}
        className="w-full"
      />
      {!race.registration.open && (
        <p className="text-muted-foreground text-sm">
          Registrace je momentálně uzavřena.
        </p>
      )}
      {lastResult && (
        <Link
          href={`/vysledky/${lastResult.year}`}
          className="text-primary block text-sm font-medium hover:underline"
        >
          Výsledky {lastResult.year} →
        </Link>
      )}
    </aside>
  );
}

export default async function PropozicePage() {
  const [page, race] = await Promise.all([
    getPropozice(container.staticPages),
    getRaceOverview(
      { settings: container.settings, results: container.results },
      new Date(),
    ),
  ]);
  if (!page.ok && page.error.kind === "not_found") notFound();
  if (!page.ok) throw new Error(page.error.message);

  return (
    <>
      <PageHeader kicker="Vše pro start" title={page.value.title} />
      <div className="max-w-wide mx-auto grid gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_20rem] lg:px-8 lg:py-16">
        <div className="lg:order-2">
          <QuickFacts race={race} />
        </div>
        <RichText html={page.value.text} className="lg:order-1" />
      </div>
    </>
  );
}

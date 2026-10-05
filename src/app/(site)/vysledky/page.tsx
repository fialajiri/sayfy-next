import type { Metadata } from "next";
import { PageHeader } from "@/components/site/page-header";
import { ResultBibLink } from "@/components/site/result-bib-link";
import { listResults } from "@/server/application/race";
import { container } from "@/server/container";

export const metadata: Metadata = {
  title: "Výsledky",
  description:
    "Výsledky minulých ročníků cyklistického závodu Sayfyho Memorial",
  alternates: { canonical: "/vysledky" },
};

export const revalidate = 3600;

export default async function VysledkyPage() {
  const result = await listResults(container.results);
  if (!result.ok) throw new Error(result.error.message);

  return (
    <div className="dark bg-asphalt-950 text-foreground">
      <PageHeader kicker="Ročník po ročníku" title="Výsledky" />
      <div className="checker-band" aria-hidden="true" />
      <div className="max-w-wide mx-auto px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {result.value.length === 0 ? (
          <p className="text-muted-foreground text-lg">Zatím žádné výsledky.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {result.value.map((item) => (
              <li key={item.id}>
                <ResultBibLink result={item} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

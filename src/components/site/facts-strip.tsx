import type { HomeContent } from "@/schemas/page-content/home";

export function FactsStrip({ facts }: { facts: HomeContent["facts"] }) {
  return (
    <dl className="max-w-wide mx-auto grid grid-cols-1 divide-y px-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-6 lg:px-8">
      {facts.map((fact) => (
        <div
          key={fact.label}
          className="flex flex-col-reverse gap-1 py-6 sm:px-8 sm:first:pl-0"
        >
          <dt className="text-muted-foreground text-sm tracking-wide uppercase">
            {fact.label}
          </dt>
          <dd className="font-display-upper text-display-2 italic">
            {fact.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  ControlSamples,
  MotifSamples,
  TypeSamples,
} from "./_components/samples";
import { BrandSwatches, SemanticSwatches } from "./_components/swatches";

export const metadata: Metadata = {
  title: "Styleguide",
  robots: { index: false },
};

// Visual QA of every token + component state, light and dark side by side.
// Development only (docs/06 §12).
export default function StyleguidePage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="max-w-wide mx-auto space-y-12 px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display-upper text-display-1">Styleguide</h1>
      <Section title="Brand palette">
        <BrandSwatches />
      </Section>
      <ThemedPair title="Semantic tokens">
        <SemanticSwatches />
      </ThemedPair>
      <ThemedPair title="Typography">
        <TypeSamples />
      </ThemedPair>
      <ThemedPair title="Controls">
        <ControlSamples />
      </ThemedPair>
      <ThemedPair title="Motifs">
        <MotifSamples />
      </ThemedPair>
    </main>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="kicker">{title}</h2>
      {children}
    </section>
  );
}

function ThemedPair({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Section title={title}>
      <div className="grid gap-4 xl:grid-cols-2">
        {(["light", "dark"] as const).map((mode) => (
          <div
            key={mode}
            className={cn(
              "bg-background text-foreground overflow-hidden rounded-2xl border p-6",
              mode === "dark" ? "dark" : "light",
            )}
          >
            <p className="text-muted-foreground mb-4 font-mono text-xs uppercase">
              {mode}
            </p>
            {children}
          </div>
        ))}
      </div>
    </Section>
  );
}

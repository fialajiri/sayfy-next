type Swatch = { name: string; className: string; note: string };

const BRAND: readonly Swatch[] = [
  {
    name: "asphalt-950",
    className: "bg-asphalt-950",
    note: "hero, footer, dark bg",
  },
  { name: "asphalt-900", className: "bg-asphalt-900", note: "cards on dark" },
  { name: "asphalt-700", className: "bg-asphalt-700", note: "borders on dark" },
  {
    name: "asphalt-400",
    className: "bg-asphalt-400",
    note: "muted text on dark",
  },
  { name: "paper", className: "bg-paper", note: "light page bg" },
  { name: "paper-2", className: "bg-paper-2", note: "alt sections, memorial" },
  { name: "ink", className: "bg-ink", note: "body text on light" },
  { name: "sayfy-300", className: "bg-sayfy-300", note: "green text on dark" },
  { name: "sayfy-500", className: "bg-sayfy-500", note: "logo green, fills" },
  { name: "sayfy-700", className: "bg-sayfy-700", note: "green text on light" },
  { name: "sayfy-900", className: "bg-sayfy-900", note: "deep panels" },
  { name: "signal", className: "bg-signal", note: "primary CTA only" },
  { name: "gold-400", className: "bg-gold-400", note: "results, on dark" },
  { name: "gold-700", className: "bg-gold-700", note: "gold text on light" },
  { name: "danger", className: "bg-danger", note: "destructive" },
];

const SEMANTIC: readonly Swatch[] = [
  { name: "background", className: "bg-background", note: "" },
  { name: "card", className: "bg-card", note: "" },
  { name: "primary", className: "bg-primary", note: "" },
  { name: "secondary", className: "bg-secondary", note: "" },
  { name: "muted", className: "bg-muted", note: "" },
  { name: "destructive", className: "bg-destructive", note: "" },
  { name: "border", className: "bg-border", note: "" },
  { name: "ring", className: "bg-ring", note: "" },
];

function SwatchGrid({ swatches }: { swatches: readonly Swatch[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {swatches.map((swatch) => (
        <li key={swatch.name} className="overflow-hidden rounded-xl border">
          <div className={`h-16 ${swatch.className}`} />
          <div className="bg-card text-card-foreground p-2 text-xs">
            <p className="font-mono font-medium">{swatch.name}</p>
            {swatch.note && (
              <p className="text-muted-foreground">{swatch.note}</p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function BrandSwatches() {
  return <SwatchGrid swatches={BRAND} />;
}

export function SemanticSwatches() {
  return <SwatchGrid swatches={SEMANTIC} />;
}

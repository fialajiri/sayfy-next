// Phase 0 placeholder. Phase 1 replaces this with the real landing page
// (hero video + countdown, news rail, results, gallery) — docs/06 §9.
export default function HomePage() {
  return (
    <section className="dark bg-asphalt-950 text-foreground">
      <div className="max-w-wide mx-auto px-4 py-24 sm:px-6 lg:px-8 lg:py-36">
        <p className="kicker text-foreground">
          Cyklistický závod · Královské město Hrob
        </p>
        <h1 className="font-display-upper text-hero mt-6 italic">
          Sayfyho
          <br />
          <span className="text-sayfy-300">Memorial</span>
        </h1>
        <p className="text-muted-foreground mt-8 max-w-xl text-lg">
          Nový web se připravuje. Do té doby platí vše na stávající adrese.
        </p>
      </div>
    </section>
  );
}

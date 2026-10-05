import type { Metadata } from "next";
import { GalleryTile } from "@/components/site/gallery-tile";
import { PageHeader } from "@/components/site/page-header";
import { listGalleries } from "@/server/application/galleries";
import { container } from "@/server/container";

export const metadata: Metadata = {
  title: "Fotogalerie",
  description: "Fotogalerie z minulých ročníků závodu Sayfyho Memorial",
  alternates: { canonical: "/fotogalerie" },
};

export const revalidate = 3600;

export default async function FotogaleriePage() {
  const result = await listGalleries(container.galleries);
  if (!result.ok) throw new Error(result.error.message);
  const galleries = result.value.filter((g) => g.count > 0);

  return (
    <>
      <PageHeader kicker="Ročníky v obrazech" title="Fotogalerie" />
      <div className="max-w-wide mx-auto px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {galleries.length === 0 ? (
          <p className="text-muted-foreground text-lg">
            Zatím žádné fotogalerie.
          </p>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {galleries.map((gallery, i) => (
              <li key={gallery.id}>
                <GalleryTile gallery={gallery} priority={i < 3} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { photoCountLabel } from "@/components/site/gallery-tile";
import { PageHeader } from "@/components/site/page-header";
import { PhotoGrid } from "@/components/site/photo-grid";
import { getGallery } from "@/server/application/galleries";
import { decodeSlugParam } from "@/server/application/news";
import { container } from "@/server/container";

export const revalidate = 3600;

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const galleries = await container.galleries.listSummaries().catch(() => []);
  return galleries.map((g) => ({ slug: g.slug }));
}

async function load(params: PageProps<"/fotogalerie/[slug]">["params"]) {
  const result = await getGallery(
    container.galleries,
    decodeSlugParam((await params).slug),
  );
  if (!result.ok && result.error.kind === "not_found") notFound();
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
}

export async function generateMetadata({
  params,
}: PageProps<"/fotogalerie/[slug]">): Promise<Metadata> {
  const gallery = await load(params);
  return {
    title: `Fotogalerie ${gallery.title}`,
    description: `Fotogalerie závodu Sayfyho Memorial ${gallery.title} — ${photoCountLabel(gallery.count)}`,
    alternates: {
      canonical: `/fotogalerie/${encodeURIComponent(gallery.slug)}`,
    },
    openGraph: gallery.cover ? { images: [{ url: gallery.cover }] } : undefined,
  };
}

export default async function GalleryPage({
  params,
}: PageProps<"/fotogalerie/[slug]">) {
  const gallery = await load(params);
  const photos = gallery.images.map((src, i) => ({
    src,
    alt: `${gallery.title} — fotografie ${i + 1}`,
  }));

  return (
    <>
      <PageHeader
        kicker="Fotogalerie"
        title={gallery.title}
        lead={photoCountLabel(gallery.count)}
      />
      <div className="max-w-wide mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <PhotoGrid photos={photos} deepLink priorityCount={5} />
      </div>
    </>
  );
}

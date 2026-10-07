import { notFound, permanentRedirect } from "next/navigation";
import { decodeSlugParam } from "@/server/application/news";
import { container } from "@/server/container";

// Legacy admin URL /fotogalerie/edit/<galleryUrl> → the new gallery manager.
// Needs a lookup (slug → id), so it can't be a static next.config redirect.
export default async function LegacyGalleryEditRedirect({
  params,
}: PageProps<"/fotogalerie/edit/[title]">) {
  const gallery = await container.galleries.findBySlug(
    decodeSlugParam((await params).title),
  );
  if (!gallery) notFound();
  permanentRedirect(`/admin/fotogalerie/${gallery.id}`);
}

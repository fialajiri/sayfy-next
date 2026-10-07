import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { GalleryManager } from "@/components/admin/gallery/gallery-manager";
import { requireAdminPage } from "@/server/actions/guards";
import { container } from "@/server/container";

export const metadata = { title: "Upravit galerii" };

export default async function EditGalleryPage({
  params,
}: PageProps<"/admin/fotogalerie/[id]">) {
  const { id } = await params;
  await requireAdminPage(`/admin/fotogalerie/${id}`);
  const gallery = await container.galleries.findById(id);
  if (!gallery) notFound();
  return (
    <>
      <AdminPageHeader
        title={`Galerie ${gallery.title}`}
        description="První fotka je titulní."
      />
      {/* key: after a concurrent-edit conflict, router.refresh() remounts with fresh state */}
      <GalleryManager key={gallery.updatedAt} initial={gallery} />
    </>
  );
}

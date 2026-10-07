import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { NewGalleryForm } from "@/components/admin/gallery/new-gallery-form";
import { requireAdminPage } from "@/server/actions/guards";

export const metadata = { title: "Nová galerie" };

export default async function NewGalleryPage() {
  await requireAdminPage("/admin/fotogalerie/nova");
  const year = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Prague",
    year: "numeric",
  }).format(new Date());
  return (
    <>
      <AdminPageHeader title="Nová galerie" />
      <NewGalleryForm suggestion={year} />
    </>
  );
}

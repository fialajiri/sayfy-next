import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { NewsForm } from "@/components/admin/news/news-form";
import { requireAdminPage } from "@/server/actions/guards";

export const metadata = { title: "Nová aktualita" };

export default async function NewNewsPage() {
  await requireAdminPage("/admin/aktuality/nova");
  return (
    <>
      <AdminPageHeader title="Nová aktualita" />
      <NewsForm
        defaults={{
          title: "",
          perex: "",
          text: "",
          mainPhoto: "",
          photoGallery: [],
          updateSlug: false,
        }}
      />
    </>
  );
}

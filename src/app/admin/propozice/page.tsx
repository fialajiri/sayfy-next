import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { PropoziceForm } from "@/components/admin/propozice/propozice-form";
import { requireAdminPage } from "@/server/actions/guards";
import { container } from "@/server/container";
import { PROPOZICE_SLUG } from "@/server/domain/static-page";

export const metadata = { title: "Propozice" };

export default async function AdminPropozicePage() {
  await requireAdminPage("/admin/propozice");
  const page = await container.staticPages.findRecordBySlug(PROPOZICE_SLUG);
  if (!page) notFound();
  return (
    <>
      <AdminPageHeader
        title="Propozice"
        description="Datum a čas závodu (28. 9., 11:00) a registrace jsou na webu doplněny automaticky."
      />
      <PropoziceForm defaults={{ title: page.title, text: page.text }} />
    </>
  );
}

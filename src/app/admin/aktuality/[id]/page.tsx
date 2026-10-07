import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { NewsForm } from "@/components/admin/news/news-form";
import { htmlToText } from "@/server/domain/excerpt";
import { requireAdminPage } from "@/server/actions/guards";
import { container } from "@/server/container";

export const metadata = { title: "Upravit aktualitu" };

export default async function EditNewsPage({
  params,
}: PageProps<"/admin/aktuality/[id]">) {
  const { id } = await params;
  await requireAdminPage(`/admin/aktuality/${id}`);
  const news = await container.news.findById(id);
  if (!news) notFound();

  return (
    <>
      <AdminPageHeader title="Upravit aktualitu" description={news.title} />
      <NewsForm
        id={news.id}
        slug={news.slug}
        defaults={{
          title: news.title,
          // Legacy perex is HTML ("<p>…</p>"); the form edits plain text.
          perex: htmlToText(news.perex),
          text: news.text,
          mainPhoto: news.mainPhoto,
          photoGallery: news.photoGallery,
          updateSlug: false,
        }}
      />
    </>
  );
}

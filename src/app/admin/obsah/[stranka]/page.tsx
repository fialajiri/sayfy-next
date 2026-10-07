import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { HomeContentForm } from "@/components/admin/content/home-form";
import { KontaktContentForm } from "@/components/admin/content/kontakt-form";
import { PodporaContentForm } from "@/components/admin/content/podpora-form";
import { SayfyContentForm } from "@/components/admin/content/sayfy-form";
import { SiteContentForm } from "@/components/admin/content/site-form";
import { requireAdminPage } from "@/server/actions/guards";
import { getPageContent } from "@/server/application/page-content";
import { container } from "@/server/container";
import { CONTENT_PAGES, isContentSlug } from "./content-pages";

export async function generateMetadata({
  params,
}: PageProps<"/admin/obsah/[stranka]">) {
  const { stranka } = await params;
  return {
    title: isContentSlug(stranka) ? CONTENT_PAGES[stranka].title : "Obsah",
  };
}

async function ContentForm({ slug }: { slug: keyof typeof CONTENT_PAGES }) {
  const repo = container.pageContent;
  switch (slug) {
    case "uvod":
      return <HomeContentForm values={await getPageContent(repo, "home")} />;
    case "sayfy":
      return <SayfyContentForm values={await getPageContent(repo, "sayfy")} />;
    case "kontakt":
      return (
        <KontaktContentForm values={await getPageContent(repo, "kontakt")} />
      );
    case "podpora":
      return (
        <PodporaContentForm values={await getPageContent(repo, "podpora")} />
      );
    case "web":
      return <SiteContentForm values={await getPageContent(repo, "site")} />;
  }
}

export default async function AdminContentPage({
  params,
}: PageProps<"/admin/obsah/[stranka]">) {
  const { stranka } = await params;
  if (!isContentSlug(stranka)) notFound();
  await requireAdminPage(`/admin/obsah/${stranka}`);
  const page = CONTENT_PAGES[stranka];

  return (
    <>
      <AdminPageHeader title={page.title} description={page.description} />
      <ContentForm slug={stranka} />
    </>
  );
}

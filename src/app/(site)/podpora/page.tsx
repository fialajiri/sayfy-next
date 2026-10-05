import type { Metadata } from "next";
import { PageHeader } from "@/components/site/page-header";
import { PartnerWall } from "@/components/site/partner-wall";
import { RichText } from "@/components/site/rich-text";
import { getPageContent } from "@/server/application/page-content";
import { listPartners } from "@/server/application/partners";
import { container } from "@/server/container";

export const metadata: Metadata = {
  title: "Podpora",
  description: "Partneři a podporovatelé závodu Sayfyho Memorial",
  alternates: { canonical: "/podpora" },
};

export const revalidate = 3600;

export default async function PodporaPage() {
  const [content, partners] = await Promise.all([
    getPageContent(container.pageContent, "podpora"),
    listPartners(container.partners),
  ]);

  return (
    <>
      <PageHeader kicker="Děkujeme" title={content.title} />
      <div className="max-w-wide mx-auto space-y-10 px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {content.lead && <RichText html={content.lead} />}
        <PartnerWall partners={partners} />
      </div>
    </>
  );
}

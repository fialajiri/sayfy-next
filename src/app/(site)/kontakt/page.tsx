import { MailIcon, MapPinIcon, PhoneIcon, UserIcon } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/site/page-header";
import { RichText } from "@/components/site/rich-text";
import { SocialLinks } from "@/components/site/social-links";
import { getPageContent } from "@/server/application/page-content";
import { container } from "@/server/container";

export const metadata: Metadata = {
  title: "Kontakt",
  description: "Kontakt na pořadatele cyklistického závodu Sayfyho Memorial",
  alternates: { canonical: "/kontakt" },
};

export const revalidate = 3600;

function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export default async function KontaktPage() {
  const [kontakt, site] = await Promise.all([
    getPageContent(container.pageContent, "kontakt"),
    getPageContent(container.pageContent, "site"),
  ]);
  const row = "flex items-center gap-3";

  return (
    <>
      <PageHeader kicker="Kontakt" title={kontakt.title} lead={kontakt.lead} />
      <div className="max-w-content mx-auto grid gap-8 px-4 py-12 sm:px-6 md:grid-cols-2 lg:px-8 lg:py-16">
        {kontakt.contacts.map((contact) => (
          <address
            key={contact.id}
            className="bg-card space-y-4 rounded-2xl border p-6 not-italic"
          >
            <p className={`${row} text-lg font-semibold`}>
              <UserIcon className="text-sayfy-700 size-5" aria-hidden="true" />
              {contact.name}
            </p>
            {contact.role && (
              <p className="text-muted-foreground -mt-2 pl-8 text-sm">
                {contact.role}
              </p>
            )}
            {contact.phone && (
              <p className={row}>
                <PhoneIcon
                  className="text-sayfy-700 size-5"
                  aria-hidden="true"
                />
                <a href={telHref(contact.phone)} className="hover:underline">
                  {contact.phone}
                </a>
              </p>
            )}
            {contact.email && (
              <p className={row}>
                <MailIcon
                  className="text-sayfy-700 size-5"
                  aria-hidden="true"
                />
                <a
                  href={`mailto:${contact.email}`}
                  className="break-all hover:underline"
                >
                  {contact.email}
                </a>
              </p>
            )}
          </address>
        ))}
        <div className="bg-card space-y-4 rounded-2xl border p-6">
          <p className={`${row} text-lg font-semibold`}>
            <MapPinIcon className="text-sayfy-700 size-5" aria-hidden="true" />
            {kontakt.place.mapUrl ? (
              <a
                href={kontakt.place.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {kontakt.place.label}
                <span className="sr-only"> (mapa, otevře se v novém okně)</span>
              </a>
            ) : (
              kontakt.place.label
            )}
          </p>
          <SocialLinks
            links={{
              facebookUrl: site.facebookUrl,
              instagramUrl: site.instagramUrl,
            }}
            className="-ml-3"
          />
        </div>
        {kontakt.extra && (
          <RichText html={kontakt.extra} className="md:col-span-2" />
        )}
      </div>
    </>
  );
}

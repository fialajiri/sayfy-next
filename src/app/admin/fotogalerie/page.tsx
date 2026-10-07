import { PlusIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { photoCountLabel } from "@/components/site/gallery-tile";
import { buttonVariants } from "@/components/ui/button";
import { requireAdminPage } from "@/server/actions/guards";
import { listGalleries } from "@/server/application/galleries";
import { container } from "@/server/container";

export const metadata = { title: "Fotogalerie" };

export default async function AdminGalleriesPage() {
  await requireAdminPage("/admin/fotogalerie");
  const result = await listGalleries(container.galleries);
  if (!result.ok) throw new Error(result.error.message);

  return (
    <>
      <AdminPageHeader
        title="Fotogalerie"
        description={`${result.value.length} galerií`}
        actions={
          <Link
            href="/admin/fotogalerie/nova"
            className={buttonVariants({ size: "lg" })}
          >
            <PlusIcon data-icon="inline-start" />
            Nová galerie
          </Link>
        }
      />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {result.value.map((gallery) => (
          <li key={gallery.id}>
            <Link
              href={`/admin/fotogalerie/${gallery.id}`}
              className="bg-card group block overflow-hidden rounded-xl border"
            >
              <div className="bg-muted relative aspect-[4/3]">
                {gallery.cover && (
                  <Image
                    src={gallery.cover}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 30vw, 50vw"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="flex items-center justify-between p-4">
                <span className="font-semibold group-hover:underline">
                  {gallery.title}
                </span>
                <span className="text-muted-foreground text-sm">
                  {photoCountLabel(gallery.count)}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

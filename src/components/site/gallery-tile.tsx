import { ImagesIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { pluralize } from "@/lib/dates";
import type { GallerySummary } from "@/server/domain/gallery";

export function photoCountLabel(count: number): string {
  return `${count} ${pluralize(count, { one: "fotka", few: "fotky", other: "fotek" })}`;
}

export function GalleryTile({
  gallery,
  priority,
}: {
  gallery: GallerySummary;
  priority?: boolean;
}) {
  return (
    <article className="group bg-asphalt-900 relative isolate aspect-[4/3] overflow-hidden rounded-2xl">
      {gallery.cover && (
        <Image
          src={gallery.cover}
          alt=""
          fill
          priority={priority}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="-z-10 object-cover transition-transform duration-(--duration-reveal) ease-(--ease-race) group-hover:scale-[1.03]"
        />
      )}
      <div
        className="from-asphalt-950/90 absolute inset-0 -z-10 bg-gradient-to-t via-transparent"
        aria-hidden="true"
      />
      <div className="flex h-full flex-col justify-between p-5 text-white">
        <span className="inline-flex items-center gap-1.5 self-end rounded-full bg-black/45 px-3 py-1 text-xs font-medium backdrop-blur-sm">
          <ImagesIcon className="size-3.5" aria-hidden="true" />
          {photoCountLabel(gallery.count)}
        </span>
        <h2 className="font-display-upper text-display-1 italic">
          <Link
            href={`/fotogalerie/${encodeURIComponent(gallery.slug)}`}
            className="after:absolute after:inset-0"
          >
            {gallery.title}
          </Link>
        </h2>
      </div>
    </article>
  );
}

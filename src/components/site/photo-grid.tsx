"use client";

import Image from "next/image";
import { useState, useSyncExternalStore, type MouseEvent } from "react";
import Lightbox from "yet-another-react-lightbox";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/counter.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import { cn } from "@/lib/utils";

export type Photo = { src: string; alt: string };

type PhotoGridProps = {
  photos: Photo[];
  /** Enables ?foto=n deep links (gallery detail pages). */
  deepLink?: boolean;
  className?: string;
  /** Number of thumbnails rendered with priority (first row). */
  priorityCount?: number;
};

const PARAM = "foto";

function subscribeHistory(onChange: () => void): () => void {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}

function readPhotoParam(): number | null {
  const value = Number(new URLSearchParams(window.location.search).get(PARAM));
  return Number.isInteger(value) && value > 0 ? value - 1 : null;
}

function writePhotoParam(index: number | null) {
  const url = new URL(window.location.href);
  if (index === null) url.searchParams.delete(PARAM);
  else url.searchParams.set(PARAM, String(index + 1));
  window.history.replaceState(window.history.state, "", url);
}

export function PhotoGrid({
  photos,
  deepLink = false,
  className,
  priorityCount = 0,
}: PhotoGridProps) {
  const urlIndex = useSyncExternalStore(
    subscribeHistory,
    readPhotoParam,
    () => null,
  );
  const [index, setIndex] = useState<number | null>(null);
  const [urlDismissed, setUrlDismissed] = useState(false);

  const fromUrl =
    deepLink && !urlDismissed && urlIndex !== null && urlIndex < photos.length
      ? urlIndex
      : null;
  const openIndex = index ?? fromUrl;

  function handleOpen(event: MouseEvent<HTMLButtonElement>) {
    setIndex(Number(event.currentTarget.dataset.index));
  }

  function handleView({ index: viewed }: { index: number }) {
    setIndex(viewed);
    if (deepLink) writePhotoParam(viewed);
  }

  function handleClose() {
    setIndex(null);
    setUrlDismissed(true);
    if (deepLink) writePhotoParam(null);
  }

  return (
    <>
      <ul
        className={cn(
          "grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5",
          className,
        )}
      >
        {photos.map((photo, i) => (
          <li
            key={photo.src}
            className="[contain-intrinsic-size:auto_240px] [content-visibility:auto]"
          >
            <button
              type="button"
              data-index={i}
              onClick={handleOpen}
              className="group bg-muted relative block aspect-[4/3] w-full cursor-zoom-in overflow-hidden rounded-xl"
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                priority={i < priorityCount}
                sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                className="object-cover transition-transform duration-(--duration-reveal) ease-(--ease-race) group-hover:scale-[1.04]"
              />
              <span className="sr-only">
                Zvětšit fotografii {i + 1} z {photos.length}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <Lightbox
        open={openIndex !== null}
        index={openIndex ?? 0}
        close={handleClose}
        on={{ view: handleView }}
        // Originals load directly (not via the image optimizer) to spare its quota.
        slides={photos.map((photo) => ({ src: photo.src, alt: photo.alt }))}
        plugins={[Counter, Thumbnails, Zoom]}
        carousel={{ finite: photos.length <= 1, preload: 2 }}
        thumbnails={{
          width: 96,
          height: 64,
          border: 0,
          borderRadius: 8,
          gap: 8,
          imageFit: "cover",
        }}
        zoom={{ maxZoomPixelRatio: 2.5 }}
        labels={{
          Previous: "Předchozí fotografie",
          Next: "Další fotografie",
          Close: "Zavřít",
          "Zoom in": "Přiblížit",
          "Zoom out": "Oddálit",
          Lightbox: "Prohlížeč fotografií",
          Carousel: "Fotografie",
          "Photo gallery": "Fotogalerie",
          Slide: "Fotografie",
          "{index} of {total}": "{index} z {total}",
        }}
        styles={{ container: { backgroundColor: "rgb(11 15 13 / 0.96)" } }}
      />
    </>
  );
}

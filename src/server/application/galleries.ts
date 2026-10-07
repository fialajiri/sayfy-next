import type {
  GalleryDetail,
  GalleryRepository,
  GallerySummary,
} from "@/server/domain/gallery";
import {
  err,
  notFound,
  ok,
  unexpected,
  type Result,
} from "@/server/domain/result";

export async function listGalleries(
  repo: GalleryRepository,
): Promise<Result<GallerySummary[]>> {
  try {
    return ok(await repo.listSummaries());
  } catch {
    return err(unexpected("Nepodařilo se načíst fotogalerie."));
  }
}

export type GalleryLookup =
  { kind: "found"; value: GalleryDetail } | { kind: "moved"; slug: string };

export async function getGallery(
  repo: GalleryRepository,
  slug: string,
): Promise<Result<GalleryLookup>> {
  try {
    const gallery = await repo.findBySlug(slug);
    if (gallery) return ok({ kind: "found", value: gallery });
    const current = await repo.findCurrentSlug(slug);
    return current
      ? ok({ kind: "moved", slug: current })
      : err(notFound("Fotogalerie nenalezena."));
  } catch {
    return err(unexpected("Nepodařilo se načíst fotogalerii."));
  }
}

/** Newest gallery with photos, for the home page teaser. */
export async function latestGallery(
  repo: GalleryRepository,
): Promise<GalleryDetail | null> {
  try {
    const newest = (await repo.listSummaries()).find((g) => g.count > 0);
    return newest ? await repo.findBySlug(newest.slug) : null;
  } catch {
    return null;
  }
}

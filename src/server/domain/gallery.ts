export type GallerySummary = {
  id: string;
  slug: string;
  title: string;
  /** Galleries are titled by year ("2023"); null when the title isn't a year. */
  year: number | null;
  cover: string | null;
  count: number;
};

export type GalleryDetail = GallerySummary & { images: string[] };

/** Admin view: raw (unencoded) stored URLs, ordered; images[0] is the cover. */
export type GalleryRecord = {
  id: string;
  title: string;
  slug: string;
  previousSlugs: string[];
  images: string[];
  updatedAt: string;
};

export const MAX_GALLERY_IMAGES = 1000;

export type GalleryRepository = {
  /** Newest year first. */
  listSummaries(): Promise<GallerySummary[]>;
  findBySlug(slug: string): Promise<GalleryDetail | null>;
  findCurrentSlug(previousSlug: string): Promise<string | null>;
  // admin
  findById(id: string): Promise<GalleryRecord | null>;
  titleTaken(title: string, exceptId?: string): Promise<boolean>;
  slugTaken(slug: string, exceptId?: string): Promise<boolean>;
  create(input: { title: string; slug: string }): Promise<GalleryRecord>;
  rename(
    id: string,
    input: { title: string; slug: string; previousSlugs: string[] },
  ): Promise<GalleryRecord | null>;
  /** Atomic append ($push $each) — concurrent uploads never overwrite each other. */
  appendImages(id: string, urls: string[]): Promise<GalleryRecord | null>;
  /** Replace the order/selection only if nobody changed the gallery since `expectedUpdatedAt`. */
  setImages(
    id: string,
    images: string[],
    expectedUpdatedAt: string,
  ): Promise<GalleryRecord | "conflict" | null>;
  delete(id: string): Promise<GalleryRecord | null>;
};

export function yearFromTitle(title: string): number | null {
  const match = /^\s*(\d{4})\s*$/.exec(title);
  return match ? Number(match[1]) : null;
}

// Newest year first; non-year titles after the years, alphabetically.
export function compareGalleries(a: GallerySummary, b: GallerySummary): number {
  if (a.year !== null && b.year !== null) return b.year - a.year;
  if (a.year !== null) return -1;
  if (b.year !== null) return 1;
  return a.title.localeCompare(b.title, "cs");
}

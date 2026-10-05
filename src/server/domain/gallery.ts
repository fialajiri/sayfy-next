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

export type GalleryRepository = {
  /** Newest year first. */
  listSummaries(): Promise<GallerySummary[]>;
  findBySlug(slug: string): Promise<GalleryDetail | null>;
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

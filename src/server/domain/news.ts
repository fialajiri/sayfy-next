// News ("aktuality"). DTOs are plain, serialisable data (ISO date strings) so
// they can cross the RSC → client boundary unchanged.

export type NewsSummary = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  mainPhoto: string;
  createdAt: string;
};

export type NewsDetail = NewsSummary & {
  /** Sanitized at render time — legacy rows were stored raw. */
  text: string;
  photoGallery: string[];
  updatedAt: string;
};

export type NewsPage = {
  items: NewsSummary[];
  page: number;
  pageCount: number;
  total: number;
};

export type AdjacentNews = {
  newer: NewsSummary | null;
  older: NewsSummary | null;
};

export type NewsRepository = {
  list(options: { page: number; pageSize: number }): Promise<NewsPage>;
  latest(limit: number): Promise<NewsSummary[]>;
  findBySlug(slug: string): Promise<NewsDetail | null>;
  adjacent(createdAt: string): Promise<AdjacentNews>;
  recentSlugs(limit: number): Promise<string[]>;
};

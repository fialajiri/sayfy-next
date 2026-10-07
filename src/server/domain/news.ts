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
  /** Short intro (legacy HTML or plain text) shown above the main photo. */
  perex: string;
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

/** Everything the admin form edits, with raw (unencoded) stored URLs. */
export type NewsRecord = {
  id: string;
  slug: string;
  previousSlugs: string[];
  title: string;
  perex: string;
  text: string;
  mainPhoto: string;
  photoGallery: string[];
  filesFromEditor: string[];
  createdAt: string;
  updatedAt: string;
};

export type NewsWrite = Pick<
  NewsRecord,
  "title" | "perex" | "text" | "mainPhoto" | "photoGallery" | "filesFromEditor"
> & {
  slug: string;
  previousSlugs: string[];
};

export type NewsRepository = {
  list(options: { page: number; pageSize: number }): Promise<NewsPage>;
  latest(limit: number): Promise<NewsSummary[]>;
  findBySlug(slug: string): Promise<NewsDetail | null>;
  /** Current slug of an article that used to live at `slug` (rename redirect). */
  findCurrentSlug(previousSlug: string): Promise<string | null>;
  adjacent(createdAt: string): Promise<AdjacentNews>;
  recentSlugs(limit: number): Promise<string[]>;
  // admin
  findById(id: string): Promise<NewsRecord | null>;
  titleTaken(title: string, exceptId?: string): Promise<boolean>;
  slugTaken(slug: string, exceptId?: string): Promise<boolean>;
  create(input: NewsWrite): Promise<NewsRecord>;
  update(id: string, input: NewsWrite): Promise<NewsRecord | null>;
  delete(id: string): Promise<NewsRecord | null>;
};

/** Cross-collection check: which of these file URLs are still used by OTHER content. */
export type AssetReferenceChecker = {
  stillReferenced(
    urls: readonly string[],
    except: { newsId?: string; galleryId?: string; staticPageId?: string },
  ): Promise<Set<string>>;
};

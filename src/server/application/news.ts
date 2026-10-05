import type {
  AdjacentNews,
  NewsDetail,
  NewsPage,
  NewsRepository,
  NewsSummary,
} from "@/server/domain/news";
import {
  err,
  notFound,
  ok,
  unexpected,
  type Result,
} from "@/server/domain/result";

export const NEWS_PAGE_SIZE = 12;

export async function listNews(
  repo: NewsRepository,
  page: number,
): Promise<Result<NewsPage>> {
  try {
    return ok(await repo.list({ page, pageSize: NEWS_PAGE_SIZE }));
  } catch {
    return err(unexpected("Nepodařilo se načíst aktuality."));
  }
}

export async function latestNews(
  repo: NewsRepository,
  limit: number,
): Promise<NewsSummary[]> {
  try {
    return await repo.latest(limit);
  } catch {
    return []; // home page section degrades to empty, never breaks the page
  }
}

export type NewsArticle = { article: NewsDetail; adjacent: AdjacentNews };

export async function getNewsArticle(
  repo: NewsRepository,
  slug: string,
): Promise<Result<NewsArticle>> {
  try {
    const article = await repo.findBySlug(slug);
    if (!article) return err(notFound("Aktualita nenalezena."));
    return ok({ article, adjacent: await repo.adjacent(article.createdAt) });
  } catch {
    return err(unexpected("Nepodařilo se načíst aktualitu."));
  }
}

/** Route params arrive URL-encoded; legacy slugs contain "!" and ",". */
export function decodeSlugParam(param: string): string {
  try {
    return decodeURIComponent(param);
  } catch {
    return param;
  }
}

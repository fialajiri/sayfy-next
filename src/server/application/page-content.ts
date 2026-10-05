import type { PageContentRepository } from "@/server/domain/page-content";
import {
  PAGE_CONTENT,
  type PageContent,
  type PageKey,
} from "@/schemas/page-content";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Admin-editable page content (docs/08 §B2). Stored data is merged over the
 * legacy defaults per top-level field; anything that fails validation falls
 * back to the defaults, so a bad document can never break a public page.
 */
export async function getPageContent<K extends PageKey>(
  repo: PageContentRepository,
  key: K,
): Promise<PageContent<K>> {
  const { schema, defaults } = PAGE_CONTENT[key];
  let stored: unknown = null;
  try {
    stored = await repo.findRaw(key);
  } catch {
    return defaults as PageContent<K>;
  }
  if (!isRecord(stored)) return defaults as PageContent<K>;

  const parsed = schema.safeParse({ ...defaults, ...stored });
  if (parsed.success) return parsed.data as PageContent<K>;

  console.warn(
    `[page-content] invalid stored "${key}" content, using defaults`,
  );
  return defaults as PageContent<K>;
}

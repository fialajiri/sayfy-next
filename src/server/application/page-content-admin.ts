import { z } from "zod";
import {
  PAGE_CONTENT,
  type PageContent,
  type PageKey,
} from "@/schemas/page-content";
import {
  isOwnUpload,
  removedAssets,
  storageKeys,
  type UploadOrigin,
} from "@/server/domain/assets";
import type { PageContentRepository } from "@/server/domain/page-content";
import {
  err,
  ok,
  unexpected,
  validation,
  type DomainError,
  type Result,
} from "@/server/domain/result";
import type { StoragePort } from "@/server/domain/storage";
import { getPageContent } from "./page-content";

export type PageContentAdminDeps = {
  pageContent: PageContentRepository;
  storage: Pick<StoragePort, "deleteMany">;
  origin: UploadOrigin;
  sanitize: (html: string) => string;
};

const UPLOAD_PREFIXES = ["stranky", "media"];
// Bundled defaults shipped in /public (docs/08 §B2): valid, never deleted.
const BUNDLED =
  /^\/(images|video|brand|partners)\/(?:[\w ().%-]+\/)*[\w ().%-]+\.(jpg|jpeg|png|webp|avif|svg|mp4|webm)$/i;

export function isBundledFile(url: string): boolean {
  return BUNDLED.test(url) && !url.includes("..");
}
const FILE_KEYS = new Set(["url", "mp4Url", "webmUrl"]);

/** Every file URL inside a content object (ImageRef.url, video URLs). */
export function fileUrlsOf(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(fileUrlsOf);
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, v]) =>
    FILE_KEYS.has(key) && typeof v === "string" && v ? [v] : fileUrlsOf(v),
  );
}

function sanitizeRich<K extends PageKey>(
  key: K,
  data: PageContent<K>,
  sanitize: (html: string) => string,
): PageContent<K> {
  const copy = structuredClone(data) as Record<string, unknown>;
  if (key === "sayfy") {
    const chapters = copy.chapters as { body: string }[];
    for (const chapter of chapters) chapter.body = sanitize(chapter.body);
  }
  if (key === "kontakt") copy.extra = sanitize(String(copy.extra ?? ""));
  if (key === "podpora") copy.lead = sanitize(String(copy.lead ?? ""));
  return copy as PageContent<K>;
}

export async function updatePageContent<K extends PageKey>(
  deps: PageContentAdminDeps,
  key: K,
  input: unknown,
): Promise<Result<PageContent<K>, DomainError>> {
  // Widen the per-page union of schemas to one ZodType; the result is re-typed below.
  const schema: z.ZodType = PAGE_CONTENT[key].schema;
  const parsed = schema.safeParse(input);
  if (!parsed.success)
    return err(
      validation(
        "Zkontrolujte formulář.",
        z.flattenError(parsed.error).fieldErrors,
      ),
    );
  try {
    const previous = await getPageContent(deps.pageContent, key);
    const data = sanitizeRich(
      key,
      parsed.data as PageContent<K>,
      deps.sanitize,
    );
    const before = fileUrlsOf(previous);
    const after = fileUrlsOf(data);
    const known = new Set(before);
    const bad = after.filter(
      (url) =>
        !known.has(url) &&
        !isBundledFile(url) &&
        !isOwnUpload(url, deps.origin, UPLOAD_PREFIXES),
    );
    if (bad.length > 0)
      return err(
        validation(
          "Formulář obsahuje neplatný soubor. Nahrajte ho prosím znovu.",
        ),
      );

    await deps.pageContent.save(key, data);

    // Only our own page uploads are ever deleted — never bundled defaults.
    const removed = removedAssets(before, after).filter((url) =>
      isOwnUpload(url, deps.origin, UPLOAD_PREFIXES),
    );
    if (removed.length > 0) {
      try {
        await deps.storage.deleteMany(storageKeys(removed, deps.origin.hosts));
      } catch {
        console.error(
          `[page-content] cleanup failed for ${removed.length} file(s)`,
        );
      }
    }
    return ok(data);
  } catch {
    return err(unexpected("Obsah se nepodařilo uložit."));
  }
}

import { z } from "zod";
import { newsFormSchema } from "@/schemas/news";
import {
  extractAssetUrls,
  removedAssets,
  storageKeys,
  unacceptableUrls,
  type UploadOrigin,
} from "@/server/domain/assets";
import type {
  AssetReferenceChecker,
  NewsRecord,
  NewsRepository,
} from "@/server/domain/news";
import {
  err,
  notFound,
  ok,
  unexpected,
  validation,
  type DomainError,
  type Result,
} from "@/server/domain/result";
import { slugify, uniqueSlug } from "@/server/domain/slug";
import type { StoragePort } from "@/server/domain/storage";

export type NewsAdminDeps = {
  news: NewsRepository;
  references: AssetReferenceChecker;
  storage: Pick<StoragePort, "deleteMany">;
  origin: UploadOrigin;
  sanitize: (html: string) => string;
};

const UPLOAD_PREFIXES = ["aktuality", "soubory"];

export type NewsSaved = {
  id: string;
  slug: string;
  previousSlug: string | null;
};

function assetsOf(
  record: Pick<NewsRecord, "mainPhoto" | "photoGallery" | "filesFromEditor">,
): string[] {
  return [record.mainPhoto, ...record.photoGallery, ...record.filesFromEditor];
}

// Best effort: an orphaned file is harmless, a failed save is not — so S3
// cleanup runs AFTER the DB write and never fails the action.
async function cleanUp(
  deps: NewsAdminDeps,
  urls: string[],
  newsId: string,
): Promise<void> {
  if (urls.length === 0) return;
  try {
    const shared = await deps.references.stillReferenced(urls, { newsId });
    const keys = storageKeys(
      urls.filter((url) => !shared.has(url)),
      deps.origin.hosts,
    );
    if (keys.length > 0) await deps.storage.deleteMany(keys);
  } catch {
    console.error(`[news] storage cleanup failed for ${urls.length} file(s)`);
  }
}

type Prepared = {
  title: string;
  perex: string;
  text: string;
  mainPhoto: string;
  photoGallery: string[];
  files: string[];
  updateSlug: boolean;
};

async function prepare(
  deps: NewsAdminDeps,
  input: unknown,
  previous: NewsRecord | null,
): Promise<Result<Prepared, DomainError>> {
  const parsed = newsFormSchema.safeParse(input);
  if (!parsed.success)
    return err(
      validation(
        "Zkontrolujte formulář.",
        z.flattenError(parsed.error).fieldErrors,
      ),
    );
  const data = parsed.data;

  if (await deps.news.titleTaken(data.title, previous?.id)) {
    return err(
      validation("Nadpis už používá jiná aktualita.", {
        title: ["Nadpis musí být unikátní."],
      }),
    );
  }
  const text = deps.sanitize(data.text);
  const files = extractAssetUrls(text, deps.origin.hosts);
  const submitted = [data.mainPhoto, ...data.photoGallery, ...files];
  const bad = unacceptableUrls(
    submitted,
    previous ? assetsOf(previous) : [],
    deps.origin,
    UPLOAD_PREFIXES,
  );
  if (bad.length > 0)
    return err(
      validation("Formulář obsahuje neplatný odkaz na soubor.", {
        mainPhoto: ["Neplatný soubor."],
      }),
    );

  return ok({ ...data, text, files });
}

export async function createNews(
  deps: NewsAdminDeps,
  input: unknown,
): Promise<Result<NewsSaved, DomainError>> {
  try {
    const prepared = await prepare(deps, input, null);
    if (!prepared.ok) return prepared;
    const { title, perex, text, mainPhoto, photoGallery, files } =
      prepared.value;
    const slug = await uniqueSlug(title, (candidate) =>
      deps.news.slugTaken(candidate),
    );
    const created = await deps.news.create({
      title,
      perex,
      text,
      mainPhoto,
      photoGallery,
      filesFromEditor: files,
      slug,
      previousSlugs: [],
    });
    return ok({ id: created.id, slug: created.slug, previousSlug: null });
  } catch {
    return err(unexpected("Aktualitu se nepodařilo uložit."));
  }
}

export async function updateNews(
  deps: NewsAdminDeps,
  id: string,
  input: unknown,
): Promise<Result<NewsSaved, DomainError>> {
  try {
    const previous = await deps.news.findById(id);
    if (!previous) return err(notFound("Aktualita nenalezena."));
    const prepared = await prepare(deps, input, previous);
    if (!prepared.ok) return prepared;
    const { title, perex, text, mainPhoto, photoGallery, files, updateSlug } =
      prepared.value;

    let slug = previous.slug;
    let previousSlugs = previous.previousSlugs;
    if (updateSlug && slugify(title) !== previous.slug) {
      slug = await uniqueSlug(title, (candidate) =>
        deps.news.slugTaken(candidate, id),
      );
      previousSlugs = [...new Set([...previousSlugs, previous.slug])];
    }
    const updated = await deps.news.update(id, {
      title,
      perex,
      text,
      mainPhoto,
      photoGallery,
      filesFromEditor: files,
      slug,
      previousSlugs,
    });
    if (!updated) return err(notFound("Aktualita nenalezena."));

    await cleanUp(
      deps,
      removedAssets(assetsOf(previous), assetsOf(updated)),
      id,
    );
    return ok({
      id,
      slug,
      previousSlug: slug === previous.slug ? null : previous.slug,
    });
  } catch {
    return err(unexpected("Aktualitu se nepodařilo uložit."));
  }
}

export async function deleteNews(
  deps: NewsAdminDeps,
  id: string,
): Promise<Result<{ slug: string }, DomainError>> {
  try {
    const deleted = await deps.news.delete(id);
    if (!deleted) return err(notFound("Aktualita nenalezena."));
    await cleanUp(deps, assetsOf(deleted), id);
    return ok({ slug: deleted.slug });
  } catch {
    return err(unexpected("Aktualitu se nepodařilo smazat."));
  }
}

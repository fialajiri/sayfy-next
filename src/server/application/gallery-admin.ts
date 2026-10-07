import { z } from "zod";
import {
  galleryAppendSchema,
  galleryImagesSchema,
  galleryTitleSchema,
} from "@/schemas/gallery";
import {
  isOwnUpload,
  removedAssets,
  storageKeys,
  type UploadOrigin,
} from "@/server/domain/assets";
import {
  MAX_GALLERY_IMAGES,
  type GalleryRecord,
  type GalleryRepository,
} from "@/server/domain/gallery";
import type { AssetReferenceChecker } from "@/server/domain/news";
import {
  conflict,
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

export type GalleryAdminDeps = {
  galleries: GalleryRepository;
  references: AssetReferenceChecker;
  storage: Pick<StoragePort, "deleteMany">;
  origin: UploadOrigin;
};

function invalid(error: z.ZodError): Result<never, DomainError> {
  return err(
    validation("Zkontrolujte zadané údaje.", z.flattenError(error).fieldErrors),
  );
}

// Best effort, after the DB write: never fail the action on S3 trouble.
async function cleanUp(
  deps: GalleryAdminDeps,
  urls: string[],
  galleryId: string,
) {
  if (urls.length === 0) return;
  try {
    const shared = await deps.references.stillReferenced(urls, { galleryId });
    const keys = storageKeys(
      urls.filter((url) => !shared.has(url)),
      deps.origin.hosts,
    );
    if (keys.length > 0) await deps.storage.deleteMany(keys);
  } catch {
    console.error(
      `[gallery] storage cleanup failed for ${urls.length} file(s)`,
    );
  }
}

async function guard<T>(
  task: () => Promise<Result<T, DomainError>>,
  message: string,
): Promise<Result<T, DomainError>> {
  try {
    return await task();
  } catch {
    return err(unexpected(message));
  }
}

export function createGallery(
  deps: GalleryAdminDeps,
  input: unknown,
): Promise<Result<GalleryRecord, DomainError>> {
  return guard(async () => {
    const parsed = galleryTitleSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const { title } = parsed.data;
    if (await deps.galleries.titleTaken(title))
      return err(
        validation("Galerie s tímto názvem už existuje.", {
          title: ["Název musí být unikátní."],
        }),
      );
    const slug = await uniqueSlug(title, (s) => deps.galleries.slugTaken(s));
    return ok(await deps.galleries.create({ title, slug }));
  }, "Galerii se nepodařilo vytvořit.");
}

export function renameGallery(
  deps: GalleryAdminDeps,
  id: string,
  input: unknown,
): Promise<
  Result<{ record: GalleryRecord; previousSlug: string | null }, DomainError>
> {
  return guard(async () => {
    const parsed = galleryTitleSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const current = await deps.galleries.findById(id);
    if (!current) return err(notFound("Galerie nenalezena."));
    const { title, updateSlug } = parsed.data;
    if (await deps.galleries.titleTaken(title, id))
      return err(
        validation("Galerie s tímto názvem už existuje.", {
          title: ["Název musí být unikátní."],
        }),
      );
    let slug = current.slug;
    let previousSlugs = current.previousSlugs;
    if (updateSlug && slugify(title) !== current.slug) {
      slug = await uniqueSlug(title, (s) => deps.galleries.slugTaken(s, id));
      previousSlugs = [...new Set([...previousSlugs, current.slug])];
    }
    const record = await deps.galleries.rename(id, {
      title,
      slug,
      previousSlugs,
    });
    if (!record) return err(notFound("Galerie nenalezena."));
    return ok({
      record,
      previousSlug: slug === current.slug ? null : current.slug,
    });
  }, "Galerii se nepodařilo přejmenovat.");
}

/** Persist a chunk of freshly uploaded photos (create-then-append, ≤50 per call). */
export function appendGalleryImages(
  deps: GalleryAdminDeps,
  id: string,
  input: unknown,
): Promise<Result<GalleryRecord, DomainError>> {
  return guard(async () => {
    const parsed = galleryAppendSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const { urls } = parsed.data;
    if (urls.some((url) => !isOwnUpload(url, deps.origin, ["galerie"])))
      return err(validation("Neplatný soubor."));
    const current = await deps.galleries.findById(id);
    if (!current) return err(notFound("Galerie nenalezena."));
    if (current.images.length + urls.length > MAX_GALLERY_IMAGES)
      return err(
        validation(`Galerie může mít nejvýše ${MAX_GALLERY_IMAGES} fotek.`),
      );
    const fresh = urls.filter((url) => !current.images.includes(url));
    const record =
      fresh.length > 0 ? await deps.galleries.appendImages(id, fresh) : current;
    return record ? ok(record) : err(notFound("Galerie nenalezena."));
  }, "Fotky se nepodařilo uložit.");
}

/** Reorder / set cover / remove. Only URLs already in the gallery are accepted. */
export function updateGalleryImages(
  deps: GalleryAdminDeps,
  id: string,
  input: unknown,
): Promise<Result<GalleryRecord, DomainError>> {
  return guard(async () => {
    const parsed = galleryImagesSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const current = await deps.galleries.findById(id);
    if (!current) return err(notFound("Galerie nenalezena."));
    const known = new Set(current.images);
    const images = [...new Set(parsed.data.images)];
    if (images.some((url) => !known.has(url)))
      return err(validation("Neplatná fotka."));
    const updated = await deps.galleries.setImages(
      id,
      images,
      parsed.data.expectedUpdatedAt,
    );
    if (updated === "conflict")
      return err(
        conflict("Galerie byla mezitím změněna. Načtěte stránku znovu."),
      );
    if (!updated) return err(notFound("Galerie nenalezena."));
    await cleanUp(deps, removedAssets(current.images, updated.images), id);
    return ok(updated);
  }, "Změny se nepodařilo uložit.");
}

export function deleteGallery(
  deps: GalleryAdminDeps,
  id: string,
): Promise<Result<GalleryRecord, DomainError>> {
  return guard(async () => {
    const deleted = await deps.galleries.delete(id);
    if (!deleted) return err(notFound("Galerie nenalezena."));
    await cleanUp(deps, deleted.images, id);
    return ok(deleted);
  }, "Galerii se nepodařilo smazat.");
}

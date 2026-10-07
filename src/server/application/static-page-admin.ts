import { z } from "zod";
import { staticPageFormSchema } from "@/schemas/static-page";
import {
  extractAssetUrls,
  removedAssets,
  storageKeys,
  unacceptableUrls,
  type UploadOrigin,
} from "@/server/domain/assets";
import type { AssetReferenceChecker } from "@/server/domain/news";
import {
  err,
  notFound,
  ok,
  unexpected,
  validation,
  type DomainError,
  type Result,
} from "@/server/domain/result";
import type {
  StaticPageRecord,
  StaticPageRepository,
} from "@/server/domain/static-page";
import type { StoragePort } from "@/server/domain/storage";

export type StaticPageAdminDeps = {
  pages: StaticPageRepository;
  references: AssetReferenceChecker;
  storage: Pick<StoragePort, "deleteMany">;
  origin: UploadOrigin;
  sanitize: (html: string) => string;
};

/**
 * Save an editable page (propozice). Assets are DERIVED from the HTML — the
 * legacy `assets` array was never maintained (it's [] although propozice has
 * images), so "previously referenced" = old assets ∪ images found in old HTML.
 */
export async function updateStaticPage(
  deps: StaticPageAdminDeps,
  slug: string,
  input: unknown,
): Promise<Result<StaticPageRecord, DomainError>> {
  try {
    const parsed = staticPageFormSchema.safeParse(input);
    if (!parsed.success)
      return err(
        validation(
          "Zkontrolujte formulář.",
          z.flattenError(parsed.error).fieldErrors,
        ),
      );
    const current = await deps.pages.findRecordBySlug(slug);
    if (!current) return err(notFound("Stránka nenalezena."));

    const text = deps.sanitize(parsed.data.text);
    const assets = extractAssetUrls(text, deps.origin.hosts);
    const before = [
      ...new Set([
        ...current.assets,
        ...extractAssetUrls(deps.sanitize(current.text), deps.origin.hosts),
      ]),
    ];
    if (
      unacceptableUrls(assets, before, deps.origin, [
        "propozice",
        "stranky",
        "soubory",
      ]).length > 0
    ) {
      return err(validation("Text obsahuje neplatný odkaz na soubor."));
    }

    const updated = await deps.pages.update(current.id, {
      title: parsed.data.title,
      text,
      assets,
    });
    if (!updated) return err(notFound("Stránka nenalezena."));

    const removed = removedAssets(before, assets);
    if (removed.length > 0) {
      try {
        const shared = await deps.references.stillReferenced(removed, {
          staticPageId: current.id,
        });
        const keys = storageKeys(
          removed.filter((url) => !shared.has(url)),
          deps.origin.hosts,
        );
        if (keys.length > 0) await deps.storage.deleteMany(keys);
      } catch {
        console.error(
          `[static-page] storage cleanup failed for ${removed.length} file(s)`,
        );
      }
    }
    return ok(updated);
  } catch {
    return err(unexpected("Stránku se nepodařilo uložit."));
  }
}

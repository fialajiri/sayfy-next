"use server";

import { revalidatePath } from "next/cache";
import { sanitizeRichText } from "@/lib/sanitize-html";
import {
  createNews,
  deleteNews,
  updateNews,
  type NewsAdminDeps,
} from "@/server/application/news-admin";
import { container } from "@/server/container";
import type { FieldErrors } from "@/server/domain/result";
import { requireAdmin } from "./guards";

export type NewsActionResult =
  | { ok: true; id: string; slug: string }
  | { ok: false; message: string; fieldErrors: FieldErrors };

function deps(): NewsAdminDeps {
  return {
    news: container.news,
    references: container.assetReferences,
    storage: container.storage,
    origin: container.uploadOrigin(),
    sanitize: sanitizeRichText,
  };
}

function revalidateNews(...slugs: (string | null)[]) {
  revalidatePath("/");
  revalidatePath("/aktuality");
  for (const slug of slugs)
    if (slug) revalidatePath(`/aktuality/${encodeURIComponent(slug)}`);
}

function failure(
  message: string,
  fieldErrors: FieldErrors = {},
): NewsActionResult {
  return { ok: false, message, fieldErrors };
}

export async function createNewsAction(
  input: unknown,
): Promise<NewsActionResult> {
  const admin = await requireAdmin();
  if (!admin.ok) return failure(admin.error.message);
  const result = await createNews(deps(), input);
  if (!result.ok)
    return failure(
      result.error.message,
      result.error.kind === "validation" ? result.error.fieldErrors : {},
    );
  revalidateNews(result.value.slug);
  return { ok: true, id: result.value.id, slug: result.value.slug };
}

export async function updateNewsAction(
  id: unknown,
  input: unknown,
): Promise<NewsActionResult> {
  const admin = await requireAdmin();
  if (!admin.ok) return failure(admin.error.message);
  if (typeof id !== "string") return failure("Neplatná aktualita.");
  const result = await updateNews(deps(), id, input);
  if (!result.ok)
    return failure(
      result.error.message,
      result.error.kind === "validation" ? result.error.fieldErrors : {},
    );
  revalidateNews(result.value.slug, result.value.previousSlug);
  return { ok: true, id, slug: result.value.slug };
}

export async function deleteNewsAction(id: unknown): Promise<NewsActionResult> {
  const admin = await requireAdmin();
  if (!admin.ok) return failure(admin.error.message);
  if (typeof id !== "string") return failure("Neplatná aktualita.");
  const result = await deleteNews(deps(), id);
  if (!result.ok) return failure(result.error.message);
  revalidateNews(result.value.slug);
  return { ok: true, id, slug: result.value.slug };
}

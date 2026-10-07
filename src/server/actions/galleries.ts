"use server";

import { revalidatePath } from "next/cache";
import {
  appendGalleryImages,
  createGallery,
  deleteGallery,
  renameGallery,
  updateGalleryImages,
  type GalleryAdminDeps,
} from "@/server/application/gallery-admin";
import { container } from "@/server/container";
import type { GalleryRecord } from "@/server/domain/gallery";
import type { DomainError, FieldErrors, Result } from "@/server/domain/result";
import { requireAdmin } from "./guards";

export type GalleryActionResult =
  | { ok: true; gallery: GalleryRecord }
  | {
      ok: false;
      message: string;
      fieldErrors: FieldErrors;
      conflict?: boolean;
    };

function deps(): GalleryAdminDeps {
  return {
    galleries: container.galleries,
    references: container.assetReferences,
    storage: container.storage,
    origin: container.uploadOrigin(),
  };
}

function revalidateGallery(...slugs: (string | null)[]) {
  revalidatePath("/");
  revalidatePath("/fotogalerie");
  revalidatePath("/vysledky", "layout"); // results pages link to the year's gallery
  for (const slug of slugs)
    if (slug) revalidatePath(`/fotogalerie/${encodeURIComponent(slug)}`);
}

function toResult(
  result: Result<GalleryRecord, DomainError>,
  ...extraSlugs: (string | null)[]
): GalleryActionResult {
  if (!result.ok) {
    return {
      ok: false,
      message: result.error.message,
      fieldErrors:
        result.error.kind === "validation"
          ? (result.error.fieldErrors ?? {})
          : {},
      conflict: result.error.kind === "conflict",
    };
  }
  revalidateGallery(result.value.slug, ...extraSlugs);
  return { ok: true, gallery: result.value };
}

const forbidden = (message: string): GalleryActionResult => ({
  ok: false,
  message,
  fieldErrors: {},
});

export async function createGalleryAction(
  input: unknown,
): Promise<GalleryActionResult> {
  const admin = await requireAdmin();
  if (!admin.ok) return forbidden(admin.error.message);
  return toResult(await createGallery(deps(), input));
}

export async function renameGalleryAction(
  id: unknown,
  input: unknown,
): Promise<GalleryActionResult> {
  const admin = await requireAdmin();
  if (!admin.ok) return forbidden(admin.error.message);
  if (typeof id !== "string") return forbidden("Neplatná galerie.");
  const result = await renameGallery(deps(), id, input);
  if (!result.ok) return toResult(result);
  return toResult(
    { ok: true, value: result.value.record },
    result.value.previousSlug,
  );
}

export async function appendGalleryImagesAction(
  id: unknown,
  input: unknown,
): Promise<GalleryActionResult> {
  const admin = await requireAdmin();
  if (!admin.ok) return forbidden(admin.error.message);
  if (typeof id !== "string") return forbidden("Neplatná galerie.");
  return toResult(await appendGalleryImages(deps(), id, input));
}

export async function updateGalleryImagesAction(
  id: unknown,
  input: unknown,
): Promise<GalleryActionResult> {
  const admin = await requireAdmin();
  if (!admin.ok) return forbidden(admin.error.message);
  if (typeof id !== "string") return forbidden("Neplatná galerie.");
  return toResult(await updateGalleryImages(deps(), id, input));
}

export async function deleteGalleryAction(
  id: unknown,
): Promise<GalleryActionResult> {
  const admin = await requireAdmin();
  if (!admin.ok) return forbidden(admin.error.message);
  if (typeof id !== "string") return forbidden("Neplatná galerie.");
  return toResult(await deleteGallery(deps(), id));
}

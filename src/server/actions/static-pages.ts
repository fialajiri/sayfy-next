"use server";

import { revalidatePath } from "next/cache";
import { sanitizeRichText } from "@/lib/sanitize-html";
import { updateStaticPage } from "@/server/application/static-page-admin";
import { container } from "@/server/container";
import type { FieldErrors } from "@/server/domain/result";
import { PROPOZICE_SLUG } from "@/server/domain/static-page";
import { requireAdmin } from "./guards";

export type StaticPageActionResult =
  { ok: true } | { ok: false; message: string; fieldErrors: FieldErrors };

export async function updatePropoziceAction(
  input: unknown,
): Promise<StaticPageActionResult> {
  const admin = await requireAdmin();
  if (!admin.ok)
    return { ok: false, message: admin.error.message, fieldErrors: {} };
  const result = await updateStaticPage(
    {
      pages: container.staticPages,
      references: container.assetReferences,
      storage: container.storage,
      origin: container.uploadOrigin(),
      sanitize: sanitizeRichText,
    },
    PROPOZICE_SLUG,
    input,
  );
  if (!result.ok) {
    return {
      ok: false,
      message: result.error.message,
      fieldErrors:
        result.error.kind === "validation"
          ? (result.error.fieldErrors ?? {})
          : {},
    };
  }
  revalidatePath("/propozice");
  return { ok: true };
}

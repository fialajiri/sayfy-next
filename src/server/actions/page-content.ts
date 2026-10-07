"use server";

import { revalidatePath } from "next/cache";
import { sanitizeRichText } from "@/lib/sanitize-html";
import { PAGE_CONTENT, type PageKey } from "@/schemas/page-content";
import { updatePageContent } from "@/server/application/page-content-admin";
import { container } from "@/server/container";
import type { FieldErrors } from "@/server/domain/result";
import { requireAdmin } from "./guards";

export type PageContentActionResult =
  { ok: true } | { ok: false; message: string; fieldErrors: FieldErrors };

// Which public routes show each page's content.
const ROUTES: Record<PageKey, string[]> = {
  home: ["/"],
  sayfy: ["/sayfy", "/"],
  kontakt: ["/kontakt"],
  podpora: ["/podpora", "/"],
  site: [], // header, footer, SEO — whole layout, below
};

function isPageKey(value: unknown): value is PageKey {
  return typeof value === "string" && value in PAGE_CONTENT;
}

export async function updatePageContentAction(
  key: unknown,
  input: unknown,
): Promise<PageContentActionResult> {
  const admin = await requireAdmin();
  if (!admin.ok)
    return { ok: false, message: admin.error.message, fieldErrors: {} };
  if (!isPageKey(key))
    return { ok: false, message: "Neznámá stránka.", fieldErrors: {} };
  const result = await updatePageContent(
    {
      pageContent: container.pageContent,
      storage: container.storage,
      origin: container.uploadOrigin(),
      sanitize: sanitizeRichText,
    },
    key,
    input,
  );
  if (!result.ok)
    return {
      ok: false,
      message: result.error.message,
      fieldErrors:
        result.error.kind === "validation"
          ? (result.error.fieldErrors ?? {})
          : {},
    };
  if (key === "site") revalidatePath("/", "layout");
  for (const route of ROUTES[key]) revalidatePath(route);
  return { ok: true };
}

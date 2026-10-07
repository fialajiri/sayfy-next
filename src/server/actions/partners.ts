"use server";

import { revalidatePath } from "next/cache";
import {
  deletePartner,
  reorderPartners,
  savePartner,
  type PartnerAdminDeps,
} from "@/server/application/partner-admin";
import { container } from "@/server/container";
import type { PartnerRecord } from "@/server/domain/partner";
import type { FieldErrors } from "@/server/domain/result";
import { LEGACY_PARTNERS } from "@/server/domain/partner";
import { requireAdmin } from "./guards";

export type PartnerActionResult =
  | { ok: true; partner?: PartnerRecord }
  | { ok: false; message: string; fieldErrors: FieldErrors };

const deps = (): PartnerAdminDeps => ({
  partners: container.partners,
  storage: container.storage,
  origin: container.uploadOrigin(),
});

function revalidatePartners() {
  revalidatePath("/");
  revalidatePath("/podpora");
}

const denied = (message: string): PartnerActionResult => ({
  ok: false,
  message,
  fieldErrors: {},
});

export async function savePartnerAction(
  id: unknown,
  input: unknown,
): Promise<PartnerActionResult> {
  const admin = await requireAdmin();
  if (!admin.ok) return denied(admin.error.message);
  if (id !== null && typeof id !== "string") return denied("Neplatný partner.");
  const result = await savePartner(deps(), id, input);
  if (!result.ok)
    return {
      ok: false,
      message: result.error.message,
      fieldErrors:
        result.error.kind === "validation"
          ? (result.error.fieldErrors ?? {})
          : {},
    };
  revalidatePartners();
  return { ok: true, partner: result.value };
}

export async function deletePartnerAction(
  id: unknown,
): Promise<PartnerActionResult> {
  const admin = await requireAdmin();
  if (!admin.ok) return denied(admin.error.message);
  if (typeof id !== "string") return denied("Neplatný partner.");
  const result = await deletePartner(deps(), id);
  if (!result.ok) return denied(result.error.message);
  revalidatePartners();
  return { ok: true };
}

export async function reorderPartnersAction(
  ids: unknown,
): Promise<PartnerActionResult> {
  const admin = await requireAdmin();
  if (!admin.ok) return denied(admin.error.message);
  const result = await reorderPartners(deps(), ids);
  if (!result.ok) return denied(result.error.message);
  revalidatePartners();
  return { ok: true };
}

/** One-time import of the 9 legacy logos (bundled /public files, real names). */
export async function importLegacyPartnersAction(): Promise<PartnerActionResult> {
  const admin = await requireAdmin();
  if (!admin.ok) return denied(admin.error.message);
  if ((await container.partners.listRaw()).length > 0)
    return denied("Partneři už jsou založeni.");
  for (const legacy of LEGACY_PARTNERS) {
    const result = await savePartner(deps(), null, {
      name: legacy.name,
      logoUrl: legacy.logoUrl,
      url: "",
    });
    if (!result.ok) return denied(result.error.message);
  }
  revalidatePartners();
  return { ok: true };
}

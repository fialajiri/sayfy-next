"use server";

import { revalidatePath } from "next/cache";
import {
  setRegistrationOpen,
  updateSettings,
} from "@/server/application/race-admin";
import { container } from "@/server/container";
import type { FieldErrors } from "@/server/domain/result";
import { DEFAULT_SETTINGS } from "@/server/domain/settings";
import { requireAdmin } from "./guards";

export type SettingsActionResult =
  { ok: true } | { ok: false; message: string; fieldErrors: FieldErrors };

function revalidateRaceInfo() {
  revalidatePath("/"); // hero CTA, ročník, finish band
  revalidatePath("/propozice"); // quick-facts card
  revalidatePath("/admin");
}

export async function updateSettingsAction(
  input: unknown,
): Promise<SettingsActionResult> {
  const admin = await requireAdmin();
  if (!admin.ok)
    return { ok: false, message: admin.error.message, fieldErrors: {} };
  const result = await updateSettings(container.settings, input);
  if (!result.ok)
    return {
      ok: false,
      message: result.error.message,
      fieldErrors:
        result.error.kind === "validation"
          ? (result.error.fieldErrors ?? {})
          : {},
    };
  revalidateRaceInfo();
  return { ok: true };
}

export async function setRegistrationOpenAction(
  open: unknown,
): Promise<SettingsActionResult> {
  const admin = await requireAdmin();
  if (!admin.ok)
    return { ok: false, message: admin.error.message, fieldErrors: {} };
  const result = await setRegistrationOpen(
    container.settings,
    DEFAULT_SETTINGS,
    open,
  );
  if (!result.ok)
    return { ok: false, message: result.error.message, fieldErrors: {} };
  revalidateRaceInfo();
  return { ok: true };
}

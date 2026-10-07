"use server";

import { revalidatePath } from "next/cache";
import { deleteResult, saveResult } from "@/server/application/race-admin";
import { container } from "@/server/container";
import type { RaceResultDto } from "@/server/domain/race-result";
import type { FieldErrors } from "@/server/domain/result";
import { requireAdmin } from "./guards";

export type ResultActionResult =
  | { ok: true; result: RaceResultDto }
  | { ok: false; message: string; fieldErrors: FieldErrors };

function revalidateResults(...years: number[]) {
  revalidatePath("/");
  revalidatePath("/vysledky");
  revalidatePath("/propozice");
  for (const year of years) revalidatePath(`/vysledky/${year}`);
}

export async function saveResultAction(
  id: unknown,
  input: unknown,
): Promise<ResultActionResult> {
  const admin = await requireAdmin();
  if (!admin.ok)
    return { ok: false, message: admin.error.message, fieldErrors: {} };
  if (id !== null && typeof id !== "string")
    return { ok: false, message: "Neplatné výsledky.", fieldErrors: {} };
  const previous = id
    ? (await container.results.list()).find((r) => r.id === id)
    : undefined;
  const result = await saveResult(container.results, id, input);
  if (!result.ok)
    return {
      ok: false,
      message: result.error.message,
      fieldErrors:
        result.error.kind === "validation"
          ? (result.error.fieldErrors ?? {})
          : {},
    };
  revalidateResults(result.value.year, ...(previous ? [previous.year] : []));
  return { ok: true, result: result.value };
}

export async function deleteResultAction(
  id: unknown,
): Promise<ResultActionResult> {
  const admin = await requireAdmin();
  if (!admin.ok)
    return { ok: false, message: admin.error.message, fieldErrors: {} };
  if (typeof id !== "string")
    return { ok: false, message: "Neplatné výsledky.", fieldErrors: {} };
  const result = await deleteResult(container.results, id);
  if (!result.ok)
    return { ok: false, message: result.error.message, fieldErrors: {} };
  revalidateResults(result.value.year);
  return { ok: true, result: result.value };
}

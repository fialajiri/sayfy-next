"use server";

import { changePassword } from "@/server/application/change-password";
import { container } from "@/server/container";
import type { FieldErrors } from "@/server/domain/result";
import { requireAdmin } from "./guards";

export type ChangePasswordState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors: FieldErrors;
};

export async function changePasswordAction(
  _previous: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const admin = await requireAdmin();
  if (!admin.ok)
    return { status: "error", message: admin.error.message, fieldErrors: {} };

  const result = await changePassword(
    { users: container.users, passwords: container.passwords },
    admin.value.id,
    {
      current: formData.get("current"),
      next: formData.get("next"),
      confirm: formData.get("confirm"),
    },
  );
  if (!result.ok) {
    const fieldErrors =
      result.error.kind === "validation"
        ? (result.error.fieldErrors ?? {})
        : {};
    return { status: "error", message: result.error.message, fieldErrors };
  }
  return { status: "success", message: "Heslo bylo změněno.", fieldErrors: {} };
}

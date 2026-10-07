import { z } from "zod";
import type { PasswordHasher, UserRepository } from "@/server/domain/auth";
import {
  err,
  ok,
  unexpected,
  validation,
  type DomainError,
  type Result,
} from "@/server/domain/result";

export const changePasswordSchema = z
  .object({
    current: z.string().min(1, "Zadejte současné heslo."),
    next: z.string().min(12, "Nové heslo musí mít alespoň 12 znaků.").max(200),
    confirm: z.string(),
  })
  .refine((v) => v.next === v.confirm, {
    path: ["confirm"],
    message: "Hesla se neshodují.",
  })
  .refine((v) => v.next !== v.current, {
    path: ["next"],
    message: "Nové heslo musí být jiné než současné.",
  });

export type ChangePasswordDeps = {
  users: Pick<UserRepository, "findByIdWithPassword" | "setPassword">;
  passwords: PasswordHasher;
};

export async function changePassword(
  deps: ChangePasswordDeps,
  userId: string,
  input: unknown,
): Promise<Result<true, DomainError>> {
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return err(
      validation(
        "Zkontrolujte zadané údaje.",
        z.flattenError(parsed.error).fieldErrors,
      ),
    );
  }
  const user = await deps.users.findByIdWithPassword(userId);
  if (
    !user ||
    !(await deps.passwords.verify(user.password, parsed.data.current))
  ) {
    return err(
      validation("Současné heslo není správné.", {
        current: ["Současné heslo není správné."],
      }),
    );
  }
  const stored = await deps.passwords.hash(parsed.data.next);
  if (!(await deps.users.setPassword(userId, stored)))
    return err(unexpected("Heslo se nepodařilo uložit."));
  return ok(true);
}

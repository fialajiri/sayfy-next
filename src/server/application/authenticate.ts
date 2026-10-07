import { z } from "zod";
import type {
  PasswordHasher,
  SessionUser,
  UserRepository,
} from "@/server/domain/auth";
import { err, ok, type Result } from "@/server/domain/result";

// One opaque failure: unknown email, wrong password and non-admin accounts are
// indistinguishable to the caller, so the form can't enumerate accounts.
export type AuthFailure = { kind: "invalid_credentials" };

export type AuthenticateDeps = {
  users: Pick<UserRepository, "findByEmailWithPassword">;
  passwords: Pick<PasswordHasher, "verify">;
};

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1).max(200),
});

const invalid = err<AuthFailure>({ kind: "invalid_credentials" });

export async function authenticateAdmin(
  deps: AuthenticateDeps,
  input: { email: unknown; password: unknown },
): Promise<Result<SessionUser, AuthFailure>> {
  const parsed = credentialsSchema.safeParse(input);
  if (!parsed.success) return invalid;

  const user = await deps.users.findByEmailWithPassword(parsed.data.email);
  if (!user) return invalid;
  if (!(await deps.passwords.verify(user.password, parsed.data.password)))
    return invalid;
  // Only admins exist today, but never let a non-admin row grant admin access.
  if (!user.isAdmin) return invalid;

  return ok({ id: user.id, email: user.email, isAdmin: true });
}

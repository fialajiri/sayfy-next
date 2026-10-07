import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { err, ok, type Result } from "@/server/domain/result";

// Data-access-layer auth checks (Next 16 auth guide): layouts don't re-run on
// client navigation and don't stop child segments from rendering, so EVERY
// admin page, server action and route handler calls one of these itself.

export type AdminIdentity = { id: string; email: string };
export type ForbiddenError = { kind: "forbidden"; message: string };

/** For server actions / route handlers: returns a typed error, never throws. */
export async function requireAdmin(): Promise<
  Result<AdminIdentity, ForbiddenError>
> {
  const session = await auth();
  if (!session?.user.isAdmin || !session.user.id) {
    return err({ kind: "forbidden", message: "Nemáte oprávnění." });
  }
  return ok({ id: session.user.id, email: session.user.email ?? "" });
}

/** For admin pages: redirects anonymous visitors to the login page. */
export async function requireAdminPage(
  currentPath: string,
): Promise<AdminIdentity> {
  const result = await requireAdmin();
  if (!result.ok)
    redirect(`/prihlaseni?next=${encodeURIComponent(currentPath)}`);
  return result.value;
}

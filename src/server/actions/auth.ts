"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";
import { checkRateLimit } from "@/server/application/rate-limit";
import { container } from "@/server/container";
import { getClientIp } from "@/server/infrastructure/rate-limit/client-ip";
import { clearAdminHint, setAdminHint } from "./admin-hint";
import { safeAdminRedirect } from "./redirect-target";

const INVALID_CREDENTIALS = "Neplatný e-mail nebo heslo.";

export type LoginState = { error: string | null; email: string };

function tooManyAttempts(retryAfterSeconds: number): string {
  const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
  return `Příliš mnoho pokusů o přihlášení. Zkuste to znovu za ${minutes} min.`;
}

// useActionState action. No client SessionProvider exists, so a server
// redirect is enough — admin pages read the fresh session via auth().
export async function loginAction(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = safeAdminRedirect(formData.get("next"));

  const limit = await checkRateLimit(container.loginRateLimiter, {
    ip: await getClientIp(),
    identifier: email,
  });
  if (!limit.allowed)
    return { error: tooManyAttempts(limit.retryAfterSeconds), email };

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError)
      return { error: INVALID_CREDENTIALS, email };
    throw error;
  }
  await setAdminHint();
  redirect(redirectTo); // outside try/catch: redirect() throws by design
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirect: false });
  await clearAdminHint();
  redirect("/prihlaseni");
}

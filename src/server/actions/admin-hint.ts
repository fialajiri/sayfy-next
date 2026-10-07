import "server-only";
import { cookies } from "next/headers";

// Non-secret UI hint ("an admin uses this browser") so public pages can show an
// "Upravit" shortcut without fetching the session for every visitor. It grants
// nothing — every admin page/action still verifies the real session.
export const ADMIN_HINT_COOKIE = "sayfy-admin";

export async function setAdminHint(): Promise<void> {
  (await cookies()).set(ADMIN_HINT_COOKIE, "1", {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function clearAdminHint(): Promise<void> {
  (await cookies()).delete(ADMIN_HINT_COOKIE);
}

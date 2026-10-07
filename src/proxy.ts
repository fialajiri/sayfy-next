import { NextResponse, type NextRequest } from "next/server";

// Optimistic check only (Next 16 auth guide): redirect /admin visits that carry
// no session cookie at all. Real authorization happens in every admin page,
// action and route handler via requireAdmin()/requireAdminPage().
const SESSION_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
];

export function proxy(request: NextRequest) {
  const hasSession = SESSION_COOKIES.some((name) => request.cookies.has(name));
  if (hasSession) return NextResponse.next();
  const login = new URL("/prihlaseni", request.url);
  login.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(login);
}

export const config = { matcher: ["/admin", "/admin/:path*"] };

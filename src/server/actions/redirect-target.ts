// Only same-origin paths inside /admin may be a post-login destination; rejects
// protocol-relative (//host), backslash and encoded tricks (open redirects).
export function safeAdminRedirect(raw: unknown): string {
  if (typeof raw !== "string") return "/admin";
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return "/admin";
  }
  if (
    !decoded.startsWith("/admin") ||
    decoded.startsWith("//") ||
    decoded.includes("\\")
  )
    return "/admin";
  if (!/^\/admin(\/[\w\-/]*)?(\?[\w=&%-]*)?$/.test(decoded)) return "/admin";
  return decoded;
}

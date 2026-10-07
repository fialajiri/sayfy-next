"use client";

import { PencilIcon } from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore } from "react";

const HINT = "sayfy-admin=1";

function noopSubscribe(): () => void {
  return () => undefined;
}

// Reads the non-secret admin hint cookie (set on login). No session fetch for
// regular visitors; the admin page itself verifies the real session.
export function AdminShortcut({ href = "/admin" }: { href?: string }) {
  const isAdminBrowser = useSyncExternalStore(
    noopSubscribe,
    () => document.cookie.split("; ").includes(HINT),
    () => false,
  );
  if (!isAdminBrowser) return null;

  return (
    <Link
      href={href}
      className="bg-signal text-ink shadow-float fixed right-4 bottom-4 z-40 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold"
    >
      <PencilIcon className="size-4" aria-hidden="true" />
      Administrace
    </Link>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { isActivePath, NAV_ITEMS } from "./navigation";

type NavLinksProps = {
  orientation?: "horizontal" | "vertical";
  onNavigate?: () => void;
};

export function NavLinks({
  orientation = "horizontal",
  onNavigate,
}: NavLinksProps) {
  const pathname = usePathname();
  const vertical = orientation === "vertical";

  return (
    <ul
      className={cn("flex", vertical ? "flex-col gap-1" : "items-center gap-1")}
    >
      {NAV_ITEMS.map((item) => {
        const active = isActivePath(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              onClick={onNavigate}
              className={cn(
                "font-display relative inline-flex items-center font-bold tracking-wide uppercase transition-colors duration-(--duration-ui)",
                "text-foreground/75 hover:text-foreground aria-[current=page]:text-foreground",
                vertical
                  ? "w-full px-2 py-3 text-2xl"
                  : "px-3 py-2 text-[1.0625rem]",
                !vertical &&
                  "after:bg-signal after:absolute after:inset-x-3 after:bottom-1 after:h-0.5 after:origin-left after:scale-x-0 after:-skew-x-12 after:transition-transform after:duration-(--duration-ui) hover:after:scale-x-100 aria-[current=page]:after:scale-x-100",
              )}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

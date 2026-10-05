"use client";

import { MenuIcon } from "lucide-react";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NavLinks } from "./nav-links";
import type { SocialLinks as SocialLinksData } from "./navigation";
import { SocialLinks } from "./social-links";

export function MobileNav({ socialLinks }: { socialLinks: SocialLinksData }) {
  const [open, setOpen] = useState(false);

  function handleNavigate() {
    setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="text-foreground inline-flex size-11 items-center justify-center rounded-full hover:bg-white/5 lg:hidden">
        <MenuIcon className="size-6" aria-hidden="true" />
        <span className="sr-only">Otevřít menu</span>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="dark bg-asphalt-950 text-foreground border-asphalt-700 p-6"
      >
        <SheetTitle className="kicker font-display text-foreground">
          Menu
        </SheetTitle>
        <nav aria-label="Hlavní navigace" className="mt-6">
          <NavLinks orientation="vertical" onNavigate={handleNavigate} />
        </nav>
        <SocialLinks links={socialLinks} className="mt-auto" />
      </SheetContent>
    </Sheet>
  );
}

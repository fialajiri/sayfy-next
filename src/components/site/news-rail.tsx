"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useRef, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

type NewsRailProps = { label: string; children: ReactNode };

// Horizontal scroll-snap rail (native, no carousel library — docs/02).
export function NewsRail({ label, children }: NewsRailProps) {
  const scroller = useRef<HTMLUListElement>(null);

  function scrollByPage(direction: 1 | -1) {
    const el = scroller.current;
    if (!el) return;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    el.scrollBy({
      left: direction * el.clientWidth * 0.85,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }

  function handlePrevious() {
    scrollByPage(-1);
  }

  function handleNext() {
    scrollByPage(1);
  }

  return (
    <div className="relative">
      <ul
        ref={scroller}
        tabIndex={0}
        aria-label={label}
        className="-mx-4 flex snap-x snap-mandatory scroll-px-4 [scrollbar-width:thin] gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:scroll-px-0 lg:px-0"
      >
        {children}
      </ul>
      <div className="mt-2 hidden justify-end gap-2 sm:flex">
        <Button
          variant="outline"
          size="icon-lg"
          onClick={handlePrevious}
          aria-label="Předchozí aktuality"
        >
          <ChevronLeftIcon />
        </Button>
        <Button
          variant="outline"
          size="icon-lg"
          onClick={handleNext}
          aria-label="Další aktuality"
        >
          <ChevronRightIcon />
        </Button>
      </div>
    </div>
  );
}

export function NewsRailItem({ children }: { children: ReactNode }) {
  return (
    <li className="w-[82%] shrink-0 snap-start sm:w-[45%] lg:w-[31.5%]">
      {children}
    </li>
  );
}

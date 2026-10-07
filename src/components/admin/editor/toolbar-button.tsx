"use client";

import type { LucideIcon } from "lucide-react";
import type { KeyboardEvent, ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type ToolbarButtonProps = {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  shortcut?: string;
};

export function ToolbarButton({
  label,
  icon: Icon,
  onClick,
  active = false,
  disabled = false,
  shortcut,
}: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            aria-pressed={active}
            className={cn(
              "text-foreground/80 inline-flex size-9 shrink-0 items-center justify-center rounded-md transition-colors",
              "hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40",
              active && "bg-sayfy-700/15 text-sayfy-700",
            )}
          />
        }
      >
        <Icon className="size-4" aria-hidden="true" />
      </TooltipTrigger>
      <TooltipContent>
        {label}
        {shortcut && <span className="ml-2 opacity-70">{shortcut}</span>}
      </TooltipContent>
    </Tooltip>
  );
}

export function ToolbarGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex items-center gap-0.5 border-r pr-1.5 last:border-r-0"
    >
      {children}
    </div>
  );
}

// Arrow keys move between toolbar buttons (WAI-ARIA toolbar pattern).
export function handleToolbarKeyDown(event: KeyboardEvent<HTMLDivElement>) {
  if (
    event.key !== "ArrowRight" &&
    event.key !== "ArrowLeft" &&
    event.key !== "Home" &&
    event.key !== "End"
  )
    return;
  const buttons = [
    ...event.currentTarget.querySelectorAll<HTMLButtonElement>(
      "button:not(:disabled)",
    ),
  ];
  const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
  if (index === -1) return;
  event.preventDefault();
  const next =
    event.key === "Home"
      ? 0
      : event.key === "End"
        ? buttons.length - 1
        : (index + (event.key === "ArrowRight" ? 1 : -1) + buttons.length) %
          buttons.length;
  buttons[next]?.focus();
}

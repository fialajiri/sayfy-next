"use client";

import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light", label: "Světlý", Icon: SunIcon },
  { value: "dark", label: "Tmavý", Icon: MoonIcon },
  { value: "system", label: "Podle systému", Icon: MonitorIcon },
] as const;

// True only after hydration — the stored theme is unknown on the server.
function useIsClient(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isClient = useIsClient();

  return (
    <fieldset className="flex items-center gap-1 rounded-full border border-white/10 p-1">
      <legend className="sr-only">Barevný režim</legend>
      {OPTIONS.map(({ value, label, Icon }) => {
        const checked = isClient && theme === value;
        return (
          <label
            key={value}
            title={label}
            className={cn(
              "inline-flex size-9 cursor-pointer items-center justify-center rounded-full transition-colors",
              "has-focus-visible:outline-ring has-focus-visible:outline-2",
              checked
                ? "text-foreground bg-white/10"
                : "text-foreground/60 hover:text-foreground",
            )}
          >
            <input
              type="radio"
              name="theme"
              value={value}
              checked={checked}
              onChange={() => setTheme(value)}
              className="sr-only"
            />
            <Icon className="size-4" aria-hidden="true" />
            <span className="sr-only">{label}</span>
          </label>
        );
      })}
    </fieldset>
  );
}

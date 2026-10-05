"use client";

import { useSyncExternalStore } from "react";
import { daysLabel, pluralize } from "@/lib/dates";

type RaceCountdownProps = {
  /** ISO start instant (28. 9. 11:00 Prague). */
  startIso: string;
  /** Server-computed day count, rendered before hydration. */
  daysLeft: number;
};

// One shared 1 s clock for all subscribers; no effects needed.
function subscribeClock(onTick: () => void): () => void {
  const id = window.setInterval(onTick, 1000);
  return () => window.clearInterval(id);
}

function nowSecond(): number {
  return Math.floor(Date.now() / 1000);
}

function serverSnapshot(): number | null {
  return null;
}

function split(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86_400),
    hours: Math.floor((total % 86_400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

export function RaceCountdown({ startIso, daysLeft }: RaceCountdownProps) {
  const second = useSyncExternalStore(
    subscribeClock,
    nowSecond,
    serverSnapshot,
  );
  const live =
    second === null ? null : split(Date.parse(startIso) - second * 1000);

  const tiles = [
    {
      value: live?.days ?? daysLeft,
      label: live ? daysLabel(live.days) : daysLabel(daysLeft),
    },
    {
      value: live?.hours,
      label: pluralize(live?.hours ?? 0, {
        one: "hodina",
        few: "hodiny",
        other: "hodin",
      }),
    },
    { value: live?.minutes, label: "min" },
    { value: live?.seconds, label: "s" },
  ];

  return (
    <div>
      {/* Static text alternative; the ticking tiles are hidden from screen readers. */}
      <p className="sr-only">
        Do startu zbývá {daysLeft} {daysLabel(daysLeft)}.
      </p>
      <ol className="flex flex-wrap gap-2 sm:gap-3" aria-hidden="true">
        {tiles.map((tile, index) => (
          <li
            key={index}
            className="flex min-w-16 flex-col items-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-sm sm:min-w-20"
          >
            <span className="text-signal font-mono text-3xl font-semibold tabular-nums sm:text-4xl">
              {tile.value === undefined
                ? "––"
                : String(tile.value).padStart(2, "0")}
            </span>
            <span className="text-muted-foreground text-[0.7rem] tracking-widest uppercase">
              {tile.label}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

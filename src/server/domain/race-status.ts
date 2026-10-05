// The race runs every year on 28 September at 11:00 Prague time, so the
// schedule is computed, never stored (docs/06 §9). Pure: callers inject `now`.

export const RACE_TIME_ZONE = "Europe/Prague";
export const RACE_MONTH = 9; // September
export const RACE_DAY = 28;
export const RACE_HOUR = 11;
/** Days after race day the "finished — results are here" state is shown. */
export const FINISHED_WINDOW_DAYS = 30;

export type RaceStatus =
  | {
      kind: "upcoming";
      year: number;
      start: Date;
      daysLeft: number;
      msLeft: number;
    }
  | { kind: "raceDay"; year: number; start: Date }
  | { kind: "finished"; year: number };

const MS_PER_DAY = 86_400_000;

function zonedParts(instant: Date, timeZone: string): Record<string, number> {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);
  return Object.fromEntries(
    parts
      .filter((p) => p.type !== "literal")
      .map((p) => [p.type, Number(p.value)]),
  );
}

// Calendar day of an instant in `timeZone`, as a UTC-midnight timestamp, so two
// days can be subtracted safely across DST changes.
function calendarDay(instant: Date, timeZone: string): number {
  const p = zonedParts(instant, timeZone);
  return Date.UTC(p.year, p.month - 1, p.day);
}

/** The instant the race starts in `year` (28. 9. 11:00 Prague). */
export function raceStart(
  year: number,
  timeZone: string = RACE_TIME_ZONE,
): Date {
  const wallClockAsUtc = Date.UTC(year, RACE_MONTH - 1, RACE_DAY, RACE_HOUR);
  const p = zonedParts(new Date(wallClockAsUtc), timeZone);
  const offset =
    Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) -
    wallClockAsUtc;
  return new Date(wallClockAsUtc - offset);
}

function upcoming(now: Date, year: number, timeZone: string): RaceStatus {
  const start = raceStart(year, timeZone);
  return {
    kind: "upcoming",
    year,
    start,
    daysLeft: Math.round(
      (calendarDay(start, timeZone) - calendarDay(now, timeZone)) / MS_PER_DAY,
    ),
    msLeft: Math.max(0, start.getTime() - now.getTime()),
  };
}

export function raceStatus(
  now: Date,
  timeZone: string = RACE_TIME_ZONE,
): RaceStatus {
  const year = zonedParts(now, timeZone).year;
  const start = raceStart(year, timeZone);
  const today = calendarDay(now, timeZone);
  const raceDay = calendarDay(start, timeZone);

  if (today < raceDay) return upcoming(now, year, timeZone);
  if (today === raceDay) return { kind: "raceDay", year, start };
  if ((today - raceDay) / MS_PER_DAY <= FINISHED_WINDOW_DAYS)
    return { kind: "finished", year };
  return upcoming(now, year + 1, timeZone);
}

/**
 * Ročník of the race in `raceYear`: the newest recorded result's edition, +1
 * if that result is from an earlier year. An admin override wins (needed only
 * if a year is skipped again, as in 2021/22).
 */
export function editionFor(
  raceYear: number,
  latestResult: { year: number; edition: number } | null,
  override: number | null,
): number | null {
  if (override !== null) return override;
  if (!latestResult) return null;
  return latestResult.year >= raceYear
    ? latestResult.edition
    : latestResult.edition + 1;
}

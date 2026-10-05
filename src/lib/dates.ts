// Czech date formatting, always in Prague time (Vercel servers run in UTC).
const TIME_ZONE = "Europe/Prague";

const shortFormat = new Intl.DateTimeFormat("cs-CZ", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "numeric",
  year: "numeric",
});

const longFormat = new Intl.DateTimeFormat("cs-CZ", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** "5. 10. 2026" */
export function formatDate(iso: string | Date): string {
  return shortFormat.format(new Date(iso));
}

/** "5. října 2026" */
export function formatDateLong(iso: string | Date): string {
  return longFormat.format(new Date(iso));
}

/** ISO date (yyyy-mm-dd) in Prague time, for <time dateTime>. */
export function isoDay(iso: string | Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(
    new Date(iso),
  );
}

const pluralRules = new Intl.PluralRules("cs-CZ");

/** Czech plural: 1 den, 2–4 dny, 5+ dní (and "few"/"many"/"other"). */
export function pluralize(
  count: number,
  forms: { one: string; few: string; other: string },
): string {
  const rule = pluralRules.select(count);
  if (rule === "one") return forms.one;
  if (rule === "few") return forms.few;
  return forms.other;
}

export function daysLabel(count: number): string {
  return pluralize(count, { one: "den", few: "dny", other: "dní" });
}

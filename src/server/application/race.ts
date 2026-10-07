import type {
  RaceResultDto,
  RaceResultRepository,
} from "@/server/domain/race-result";
import {
  editionFor,
  raceStatus,
  type RaceStatus,
} from "@/server/domain/race-status";
import {
  err,
  notFound,
  ok,
  unexpected,
  type Result,
} from "@/server/domain/result";
import {
  DEFAULT_SETTINGS,
  type SettingsRepository,
  type SiteSettingsDto,
} from "@/server/domain/settings";

export async function getSettings(
  repo: Pick<SettingsRepository, "find">,
): Promise<SiteSettingsDto> {
  try {
    return { ...DEFAULT_SETTINGS, ...(await repo.find()) };
  } catch {
    // Fail safe: a DB hiccup must never open registration or break the page.
    return { ...DEFAULT_SETTINGS, registrationOpen: false };
  }
}

export async function listResults(
  repo: Pick<RaceResultRepository, "list">,
): Promise<Result<RaceResultDto[]>> {
  try {
    return ok(await repo.list());
  } catch {
    return err(unexpected("Nepodařilo se načíst výsledky."));
  }
}

export async function getResult(
  repo: Pick<RaceResultRepository, "findByYear">,
  year: number,
): Promise<Result<RaceResultDto>> {
  if (!Number.isInteger(year)) return err(notFound("Výsledky nenalezeny."));
  try {
    const result = await repo.findByYear(year);
    return result ? ok(result) : err(notFound("Výsledky nenalezeny."));
  } catch {
    return err(unexpected("Nepodařilo se načíst výsledky."));
  }
}

export type RaceOverview = {
  status: RaceStatus;
  /** Ročník of the race the status refers to; null if unknown. */
  edition: number | null;
  registration: { open: boolean; url: string };
  results: RaceResultDto[];
};

export async function getRaceOverview(
  deps: {
    settings: Pick<SettingsRepository, "find">;
    results: Pick<RaceResultRepository, "list">;
  },
  now: Date,
): Promise<RaceOverview> {
  const [settings, resultsResult] = await Promise.all([
    getSettings(deps.settings),
    listResults(deps.results),
  ]);
  const results = resultsResult.ok ? resultsResult.value : [];
  const status = raceStatus(now);
  return {
    status,
    edition: editionFor(
      status.year,
      results[0] ?? null,
      settings.editionOverride,
    ),
    registration: {
      open: settings.registrationOpen,
      url: settings.registrationUrl,
    },
    results,
  };
}

import type {
  RaceResultDto,
  RaceResultRepository,
} from "@/server/domain/race-result";
import {
  DEFAULT_SETTINGS,
  type SettingsRepository,
} from "@/server/domain/settings";
import { getRaceOverview, getSettings } from "./race";

const result = (year: number, edition: number): RaceResultDto => ({
  id: String(year),
  year,
  edition,
  url: "https://sportt.cz/racesResults/resultlist/1",
  note: null,
  embeddable: true,
});

const results: Pick<RaceResultRepository, "list" | "findByYear"> = {
  list: async () => [result(2026, 16), result(2025, 15)],
  findByYear: async () => null,
};

describe("getSettings", () => {
  it("fails safe — registration closed — when the DB is down", async () => {
    const down: Pick<SettingsRepository, "find"> = {
      find: async () => {
        throw new Error("down");
      },
    };
    expect(await getSettings(down)).toEqual({
      ...DEFAULT_SETTINGS,
      registrationOpen: false,
    });
  });
});

describe("getRaceOverview", () => {
  const settings: Pick<SettingsRepository, "find"> = {
    find: async () => ({ registrationOpen: true }),
  };

  it("derives the ročník of the finished race from its result", async () => {
    const overview = await getRaceOverview(
      { settings, results },
      new Date("2026-10-05T12:00:00Z"),
    );
    expect(overview.status.kind).toBe("finished");
    expect(overview.edition).toBe(16);
    expect(overview.registration.open).toBe(true);
  });

  it("derives the next ročník for next year's countdown", async () => {
    const overview = await getRaceOverview(
      { settings, results },
      new Date("2027-03-01T12:00:00Z"),
    );
    expect(overview.status).toMatchObject({ kind: "upcoming", year: 2027 });
    expect(overview.edition).toBe(17);
  });
});

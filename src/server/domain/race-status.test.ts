import { editionFor, raceStart, raceStatus } from "./race-status";

describe("raceStart", () => {
  it("is 11:00 Prague on 28 September (CEST, UTC+2)", () => {
    expect(raceStart(2027).toISOString()).toBe("2027-09-28T09:00:00.000Z");
    expect(raceStart(2026).toISOString()).toBe("2026-09-28T09:00:00.000Z");
  });
});

describe("raceStatus", () => {
  it("counts down to this year's race before 28. 9.", () => {
    const status = raceStatus(new Date("2027-08-24T12:00:00Z"));
    expect(status).toMatchObject({
      kind: "upcoming",
      year: 2027,
      daysLeft: 35,
    });
  });

  it("is still upcoming at 23:59 Prague the day before", () => {
    const status = raceStatus(new Date("2027-09-27T21:59:00Z")); // 23:59 CEST
    expect(status).toMatchObject({ kind: "upcoming", year: 2027, daysLeft: 1 });
    if (status.kind === "upcoming")
      expect(status.msLeft).toBe(11 * 3_600_000 + 60_000);
  });

  it("is race day from 00:00 Prague, while UTC is still the day before", () => {
    expect(raceStatus(new Date("2027-09-27T22:30:00Z"))).toMatchObject({
      kind: "raceDay",
      year: 2027,
    });
  });

  it("stays race day after the start, until midnight Prague", () => {
    expect(raceStatus(new Date("2027-09-28T21:30:00Z"))).toMatchObject({
      kind: "raceDay",
    });
  });

  it("shows finished for the window after the race", () => {
    expect(raceStatus(new Date("2027-09-28T22:10:00Z"))).toEqual({
      kind: "finished",
      year: 2027,
    });
    expect(raceStatus(new Date("2027-10-28T12:00:00Z"))).toEqual({
      kind: "finished",
      year: 2027,
    });
  });

  it("then counts down to next year, across the DST change and new year", () => {
    expect(raceStatus(new Date("2027-11-05T12:00:00Z"))).toMatchObject({
      kind: "upcoming",
      year: 2028,
    });
    const january = raceStatus(new Date("2028-01-01T00:30:00Z"));
    expect(january).toMatchObject({ kind: "upcoming", year: 2028 });
  });

  it("today (5. 10. 2026) is the finished window of the 2026 race", () => {
    expect(raceStatus(new Date("2026-10-05T19:00:00Z"))).toEqual({
      kind: "finished",
      year: 2026,
    });
  });
});

describe("editionFor", () => {
  const latest = { year: 2026, edition: 16 };

  it("is the next ročník for a future race", () => {
    expect(editionFor(2027, latest, null)).toBe(17);
  });

  it("is the recorded ročník once that year's result exists", () => {
    expect(editionFor(2026, latest, null)).toBe(16);
  });

  it("lets an admin override win, and is unknown without data", () => {
    expect(editionFor(2027, latest, 20)).toBe(20);
    expect(editionFor(2027, null, null)).toBeNull();
  });
});

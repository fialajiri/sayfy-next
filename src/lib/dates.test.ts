import { daysLabel, formatDate, formatDateLong, isoDay } from "./dates";

describe("dates", () => {
  it("formats in Prague time, not UTC", () => {
    // 30. 9. 2026 23:30Z is already 1. 10. in Prague
    expect(formatDate("2026-09-30T23:30:00Z")).toBe("1. 10. 2026");
    expect(isoDay("2026-09-30T23:30:00Z")).toBe("2026-10-01");
  });

  it("formats long Czech dates", () => {
    expect(formatDateLong("2026-09-28T09:00:00Z")).toBe("28. září 2026");
  });

  it("uses Czech plural forms for days", () => {
    expect([1, 2, 4, 5, 22, 35].map((n) => `${n} ${daysLabel(n)}`)).toEqual([
      "1 den",
      "2 dny",
      "4 dny",
      "5 dní",
      "22 dní",
      "35 dní",
    ]);
  });
});

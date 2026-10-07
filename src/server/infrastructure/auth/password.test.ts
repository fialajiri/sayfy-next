import fixture from "./legacy-password.fixture.json";
import {
  hashLegacyPassword,
  isLegacyPasswordFormat,
  verifyLegacyPassword,
} from "./password";

// The fixture was produced by the LEGACY backend's own Password.generatePassword
// (sayfy-backend-ts/src/services/password.ts) for a test-only password — the
// most important test in the project (docs/07 §Testing).
describe("legacy password compatibility", () => {
  it("verifies a hash produced by the legacy backend", async () => {
    expect(fixture.legacyCompareOk).toBe(true);
    expect(await verifyLegacyPassword(fixture.stored, fixture.password)).toBe(
      true,
    );
  });

  it("rejects a wrong password", async () => {
    expect(
      await verifyLegacyPassword(fixture.stored, `${fixture.password}x`),
    ).toBe(false);
  });

  it("returns false (never throws) for malformed stored values", async () => {
    for (const stored of [
      "",
      "abc",
      "nodot",
      `${"0".repeat(1024)}.`,
      `${"z".repeat(1024)}.${"0".repeat(64)}`,
    ]) {
      expect(await verifyLegacyPassword(stored, "x")).toBe(false);
    }
  });

  it("writes new hashes in the identical legacy format, with fresh salts", async () => {
    const [a, b] = await Promise.all([
      hashLegacyPassword("Nové-heslo-ř!"),
      hashLegacyPassword("Nové-heslo-ř!"),
    ]);
    expect(isLegacyPasswordFormat(a)).toBe(true);
    expect(a).not.toBe(b);
    expect(await verifyLegacyPassword(a, "Nové-heslo-ř!")).toBe(true);
  });
});

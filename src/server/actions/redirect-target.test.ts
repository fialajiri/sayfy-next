import { safeAdminRedirect } from "./redirect-target";

describe("safeAdminRedirect", () => {
  it("keeps admin paths", () => {
    expect(safeAdminRedirect("/admin/aktuality")).toBe("/admin/aktuality");
    expect(safeAdminRedirect("%2Fadmin%2Fucet")).toBe("/admin/ucet");
  });

  it("rejects everything else", () => {
    for (const bad of [
      undefined,
      "",
      "/",
      "https://evil.example",
      "//evil.example/admin",
      "/admin\\..\\x",
      "/administrace-evil",
      "/admin/<script>",
      "%E0%A4%A",
    ]) {
      expect(safeAdminRedirect(bad)).toBe("/admin");
    }
  });
});

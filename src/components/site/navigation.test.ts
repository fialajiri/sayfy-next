import { isActivePath } from "./navigation";

describe("isActivePath", () => {
  it("matches home only exactly", () => {
    expect(isActivePath("/", "/")).toBe(true);
    expect(isActivePath("/aktuality", "/")).toBe(false);
  });

  it("matches a section and its detail pages", () => {
    expect(isActivePath("/aktuality", "/aktuality")).toBe(true);
    expect(
      isActivePath("/aktuality/zavod-zna-sveho-viteze", "/aktuality"),
    ).toBe(true);
  });

  it("does not match a sibling that shares a prefix", () => {
    expect(isActivePath("/sayfy-extra", "/sayfy")).toBe(false);
  });
});

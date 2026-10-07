import { buildUploadKey, extensionFor, isDeletableKey } from "./storage";

describe("storage key rules", () => {
  it("builds server-controlled keys", () => {
    expect(
      buildUploadKey({
        envPrefix: "dev/",
        prefix: "aktuality",
        scope: "nova-trat",
        id: "abc",
        extension: "jpg",
      }),
    ).toBe("dev/aktuality/nova-trat/abc.jpg");
    expect(
      buildUploadKey({
        envPrefix: "",
        prefix: "galerie",
        scope: "2027",
        id: "x",
        extension: "webp",
      }),
    ).toBe("galerie/2027/x.webp");
  });

  it("maps allowed MIME types to extensions only", () => {
    expect(extensionFor("image/jpeg")).toBe("jpg");
    expect(extensionFor("application/pdf")).toBe("pdf");
    expect(extensionFor("text/html")).toBeNull();
  });

  it("never lets dev delete legacy/production objects", () => {
    expect(isDeletableKey("2019/IMG_7449.jpg", "dev/")).toBe(false);
    expect(isDeletableKey("aktuality/x/a.jpg", "dev/")).toBe(false);
    expect(isDeletableKey("dev/aktuality/x/a.jpg", "dev/")).toBe(true);
    expect(isDeletableKey("2019/IMG_7449.jpg", "")).toBe(true);
  });
});

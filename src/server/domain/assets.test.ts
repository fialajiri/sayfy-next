import {
  extractAssetUrls,
  isOwnUpload,
  removedAssets,
  storageKeys,
  unacceptableUrls,
} from "./assets";

const HOST = "sayfyho-memorial.s3.eu-central-1.amazonaws.com";
const S3 = `https://${HOST}`;
const origin = { hosts: [HOST], envPrefix: "dev/" };

describe("extractAssetUrls", () => {
  it("finds our images and attachment links, ignoring foreign hosts and plain links", () => {
    const html = `<p><img src="${S3}/a.jpg"><img src="https://evil.example/x.jpg"></p>
      <a href="https://mapy.cz/s/x">mapa</a>
      <a data-attachment="" href="${S3}/dev/soubory/x/p.pdf" download>p.pdf</a>
      <a class="editor--file" target="_blank" href="${S3}/aktuality/old.pdf">old.pdf</a>
      <img src="${S3}/a.jpg">`;
    expect(extractAssetUrls(html, [HOST])).toEqual([
      `${S3}/a.jpg`,
      `${S3}/dev/soubory/x/p.pdf`,
      `${S3}/aktuality/old.pdf`,
    ]);
  });
});

describe("removedAssets", () => {
  it("returns what disappeared, treating encoded and raw legacy URLs as equal", () => {
    const before = [`${S3}/aktuality/x/a b.jpg`, `${S3}/aktuality/x/c.jpg`];
    const after = [`${S3}/aktuality/x/a%20b.jpg`];
    expect(removedAssets(before, after)).toEqual([`${S3}/aktuality/x/c.jpg`]);
  });
});

describe("upload acceptance", () => {
  it("accepts fresh uploads under allowed prefixes only", () => {
    expect(
      isOwnUpload(`${S3}/dev/aktuality/x/u.jpg`, origin, ["aktuality"]),
    ).toBe(true);
    expect(
      isOwnUpload(`${S3}/dev/galerie/2027/u.jpg`, origin, ["aktuality"]),
    ).toBe(false);
    expect(isOwnUpload(`${S3}/aktuality/x/u.jpg`, origin, ["aktuality"])).toBe(
      false,
    );
  });

  it("allows legacy URLs already on the record, rejects crafted ones", () => {
    const previously = [`${S3}/2019/IMG_7449.jpg`];
    const submitted = [
      `${S3}/2019/IMG_7449.jpg`,
      `${S3}/dev/aktuality/x/new.jpg`,
      `${S3}/2020/someone-elses.jpg`,
    ];
    expect(
      unacceptableUrls(submitted, previously, origin, ["aktuality"]),
    ).toEqual([`${S3}/2020/someone-elses.jpg`]);
  });

  it("maps URLs to keys", () => {
    expect(storageKeys([`${S3}/a%20b.jpg`, "/local.png"], [HOST])).toEqual([
      "a b.jpg",
    ]);
  });
});

import { encodeImageUrl, storageKeyFromUrl } from "./storage-key";

const HOSTS = [
  "sayfyho-memorial.s3.eu-central-1.amazonaws.com",
  "d3o6i10cj9gxf0.cloudfront.net",
];

describe("storageKeyFromUrl", () => {
  it("extracts the key from an S3 or CloudFront URL", () => {
    expect(
      storageKeyFromUrl(
        "https://sayfyho-memorial.s3.eu-central-1.amazonaws.com/2019/IMG_7449.jpg",
        HOSTS,
      ),
    ).toBe("2019/IMG_7449.jpg");
    expect(
      storageKeyFromUrl(
        "https://d3o6i10cj9gxf0.cloudfront.net/galerie/x.jpg",
        HOSTS,
      ),
    ).toBe("galerie/x.jpg");
  });

  it("decodes encoded legacy keys", () => {
    expect(
      storageKeyFromUrl(
        "https://sayfyho-memorial.s3.eu-central-1.amazonaws.com/aktuality/propozice/mapy%20(1).png",
        HOSTS,
      ),
    ).toBe("aktuality/propozice/mapy (1).png");
  });

  it("refuses foreign hosts, http, relative paths and malformed escapes", () => {
    expect(
      storageKeyFromUrl("https://evil.example/2019/a.jpg", HOSTS),
    ).toBeNull();
    expect(
      storageKeyFromUrl(
        "http://sayfyho-memorial.s3.eu-central-1.amazonaws.com/a.jpg",
        HOSTS,
      ),
    ).toBeNull();
    expect(storageKeyFromUrl("/images/sayfy/sayfy-1.jpg", HOSTS)).toBeNull();
    expect(
      storageKeyFromUrl(
        "https://d3o6i10cj9gxf0.cloudfront.net/%E0%A4%A",
        HOSTS,
      ),
    ).toBeNull();
  });
});

describe("encodeImageUrl", () => {
  it("encodes spaces and keeps already-encoded segments stable", () => {
    const raw =
      "https://sayfyho-memorial.s3.eu-central-1.amazonaws.com/aktuality/propozice/mapy (1).png";
    const encoded = encodeImageUrl(raw);
    expect(encoded).toBe(
      "https://sayfyho-memorial.s3.eu-central-1.amazonaws.com/aktuality/propozice/mapy%20(1).png",
    );
    expect(encodeImageUrl(encoded)).toBe(encoded);
  });

  it("encodes ! and , from legacy news folders", () => {
    expect(
      encodeImageUrl(
        "https://sayfyho-memorial.s3.eu-central-1.amazonaws.com/aktuality/diky,-diky!/a.jpg",
      ),
    ).toBe(
      "https://sayfyho-memorial.s3.eu-central-1.amazonaws.com/aktuality/diky%2C-diky!/a.jpg",
    );
  });
});

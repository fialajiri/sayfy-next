import { sanitizeRichText } from "./sanitize-html";

const S3 = "https://sayfyho-memorial.s3.eu-central-1.amazonaws.com";

describe("sanitizeRichText", () => {
  it("removes scripts, event handlers and javascript: links", () => {
    const out = sanitizeRichText(
      `<p onclick="x()">A<script>alert(1)</script></p><a href="javascript:alert(1)">b</a>`,
    );
    expect(out).not.toMatch(/script|onclick|javascript/);
    expect(out).toContain("<p>A</p>");
  });

  it("keeps the legacy propozice markup", () => {
    const html = `<h3>Kategorie</h3><ul><li><strong>Hobby</strong> <em>13 km</em></li></ul><p><a target="_blank" rel="noopener" href="https://mapy.cz/s/gujokacuko">mapa</a></p><img src="${S3}/aktuality/propozice/mapy%20(1).png" alt="an image from editor">`;
    const out = sanitizeRichText(html);
    expect(out).toContain("<h3>Kategorie</h3>");
    expect(out).toContain('rel="noopener noreferrer nofollow"');
    expect(out).toContain(
      `<img src="${S3}/aktuality/propozice/mapy%20(1).png"`,
    );
  });

  it("drops images from foreign hosts and non-https", () => {
    expect(sanitizeRichText(`<img src="https://evil.example/x.png">`)).toBe("");
    expect(
      sanitizeRichText(
        `<img src="http://sayfyho-memorial.s3.eu-central-1.amazonaws.com/x.png">`,
      ),
    ).toBe("");
  });

  it("only allows youtube-nocookie embeds", () => {
    const ok = `<iframe src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"></iframe>`;
    expect(sanitizeRichText(ok)).toContain(
      "youtube-nocookie.com/embed/dQw4w9WgXcQ",
    );
    expect(
      sanitizeRichText(`<iframe src="https://evil.example/embed/x"></iframe>`),
    ).toBe("");
  });

  it("keeps alignment and palette colours, drops other styles", () => {
    const out = sanitizeRichText(
      `<p style="text-align:center; position:fixed">a</p><span style="color:#1b7a57">b</span><span style="color:red">c</span>`,
    );
    expect(out).toContain('style="text-align:center"');
    expect(out).toContain('style="color:#1b7a57"');
    expect(out).not.toContain("red");
  });

  it("keeps tables with spans, figures and attachments", () => {
    const out = sanitizeRichText(
      `<table><tbody><tr><td colspan="2">x</td></tr></tbody></table><figure data-align="center" data-width="50"><img src="${S3}/a.jpg" alt="a"><figcaption>c</figcaption></figure><a href="${S3}/soubory/p.pdf" download data-attachment>p.pdf</a>`,
    );
    expect(out).toContain('<td colspan="2">');
    expect(out).toContain('data-align="center"');
    expect(out).toContain("<figcaption>c</figcaption>");
    expect(out).toContain("data-attachment");
  });
});

describe("sanitizeRichText colours", () => {
  it("keeps only brand-palette colours, in hex or rgb notation", () => {
    expect(
      sanitizeRichText('<span style="color: rgb(27, 122, 87)">a</span>'),
    ).toContain("rgb(27, 122, 87)");
    expect(sanitizeRichText('<span style="color: #C2410C">a</span>')).toContain(
      "#C2410C",
    );
    expect(
      sanitizeRichText('<span style="color: rgb(255, 0, 0)">a</span>'),
    ).toBe("<span>a</span>");
  });
});

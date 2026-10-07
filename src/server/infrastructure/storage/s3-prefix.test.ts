import { storageEnvPrefix } from "./s3";

describe("storageEnvPrefix", () => {
  it("isolates every non-Vercel-production environment, including local `next start`", () => {
    expect(storageEnvPrefix({ NODE_ENV: "production" })).toBe("dev/");
    expect(storageEnvPrefix({ NODE_ENV: "development" })).toBe("dev/");
    expect(
      storageEnvPrefix({ NODE_ENV: "production", VERCEL_ENV: "preview" }),
    ).toBe("dev/");
  });

  it("uses the real namespace only on Vercel production", () => {
    expect(
      storageEnvPrefix({ NODE_ENV: "production", VERCEL_ENV: "production" }),
    ).toBe("");
  });

  it("honours an explicit prefix", () => {
    expect(storageEnvPrefix({ S3_KEY_PREFIX: "staging" })).toBe("staging/");
  });
});

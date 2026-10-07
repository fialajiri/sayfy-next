import "server-only";
import {
  hashLegacyPassword,
  verifyLegacyPassword,
} from "./infrastructure/auth/password";
import { galleryRepository } from "./infrastructure/db/repositories/gallery.repository";
import { newsRepository } from "./infrastructure/db/repositories/news.repository";
import { pageContentRepository } from "./infrastructure/db/repositories/page-content.repository";
import { partnerRepository } from "./infrastructure/db/repositories/partner.repository";
import { raceResultRepository } from "./infrastructure/db/repositories/race-result.repository";
import { settingsRepository } from "./infrastructure/db/repositories/settings.repository";
import { staticPageRepository } from "./infrastructure/db/repositories/static-page.repository";
import { userRepository } from "./infrastructure/db/repositories/user.repository";
import { createRateLimiter } from "./infrastructure/rate-limit/upstash";
import { createS3Storage, storageEnvPrefix } from "./infrastructure/storage/s3";
import { assetReferenceRepository } from "./infrastructure/db/repositories/asset-reference.repository";

// Composition root: the one place that picks concrete infrastructure. Pages and
// actions pass these ports to use cases — they never touch Mongoose directly.
export const container = {
  news: newsRepository,
  galleries: galleryRepository,
  staticPages: staticPageRepository,
  results: raceResultRepository,
  settings: settingsRepository,
  partners: partnerRepository,
  pageContent: pageContentRepository,
  users: userRepository,
  storage: createS3Storage(),
  assetReferences: assetReferenceRepository,
  /** Hosts our files live on + the dev key prefix (docs/03 §3–4). */
  uploadOrigin: () => ({
    hosts: [
      "sayfyho-memorial.s3.eu-central-1.amazonaws.com",
      "d3o6i10cj9gxf0.cloudfront.net",
      ...(process.env.S3_PUBLIC_HOST
        ? [process.env.S3_PUBLIC_HOST.trim()]
        : []),
    ],
    envPrefix: storageEnvPrefix(),
  }),
  passwords: { verify: verifyLegacyPassword, hash: hashLegacyPassword },
  // 5 failed-or-not attempts per 15 min, per IP and per email (docs/plans/phase-2).
  loginRateLimiter: createRateLimiter({
    limit: 5,
    windowMinutes: 15,
    prefix: "rl:login",
  }),
};

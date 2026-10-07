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
  passwords: { verify: verifyLegacyPassword, hash: hashLegacyPassword },
  // 5 failed-or-not attempts per 15 min, per IP and per email (docs/plans/phase-2).
  loginRateLimiter: createRateLimiter({
    limit: 5,
    windowMinutes: 15,
    prefix: "rl:login",
  }),
};

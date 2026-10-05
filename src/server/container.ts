import "server-only";
import { galleryRepository } from "./infrastructure/db/repositories/gallery.repository";
import { newsRepository } from "./infrastructure/db/repositories/news.repository";
import { pageContentRepository } from "./infrastructure/db/repositories/page-content.repository";
import { partnerRepository } from "./infrastructure/db/repositories/partner.repository";
import { raceResultRepository } from "./infrastructure/db/repositories/race-result.repository";
import { settingsRepository } from "./infrastructure/db/repositories/settings.repository";
import { staticPageRepository } from "./infrastructure/db/repositories/static-page.repository";

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
};

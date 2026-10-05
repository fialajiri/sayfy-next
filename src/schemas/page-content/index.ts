import type { z } from "zod";
import { DEFAULT_HOME_CONTENT, homeContentSchema } from "./home";
import { DEFAULT_KONTAKT_CONTENT, kontaktContentSchema } from "./kontakt";
import { DEFAULT_PODPORA_CONTENT, podporaContentSchema } from "./podpora";
import { DEFAULT_SAYFY_CONTENT, sayfyContentSchema } from "./sayfy";
import { DEFAULT_SITE_CONTENT, siteContentSchema } from "./site";

// Registry of admin-editable pages (docs/08 §B2): schema + legacy default.
export const PAGE_CONTENT = {
  site: { schema: siteContentSchema, defaults: DEFAULT_SITE_CONTENT },
  home: { schema: homeContentSchema, defaults: DEFAULT_HOME_CONTENT },
  sayfy: { schema: sayfyContentSchema, defaults: DEFAULT_SAYFY_CONTENT },
  kontakt: { schema: kontaktContentSchema, defaults: DEFAULT_KONTAKT_CONTENT },
  podpora: { schema: podporaContentSchema, defaults: DEFAULT_PODPORA_CONTENT },
} as const;

export type PageKey = keyof typeof PAGE_CONTENT;
export type PageContent<K extends PageKey> = z.infer<
  (typeof PAGE_CONTENT)[K]["schema"]
>;

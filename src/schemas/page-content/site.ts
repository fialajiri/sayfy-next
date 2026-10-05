import { z } from "zod";
import { imageRefSchema, optionalUrlSchema } from "./shared";

export const siteContentSchema = z.object({
  facebookUrl: optionalUrlSchema,
  instagramUrl: optionalUrlSchema,
  seo: z.object({
    description: z.string().min(1).max(300),
    keywords: z.array(z.string().min(1).max(60)).max(20),
    ogImage: imageRefSchema,
  }),
  footerTagline: z.string().min(1).max(80),
});
export type SiteContent = z.infer<typeof siteContentSchema>;

// Legacy values: navigation-links.tsx (socials) and _document.tsx (SEO).
export const DEFAULT_SITE_CONTENT: SiteContent = {
  facebookUrl: "https://www.facebook.com/sayfyhomemorial",
  instagramUrl: "https://www.instagram.com/sayfyhomemorial/",
  seo: {
    description: "Domovská stránka cyklistického závodu Sayfyho Memorial",
    keywords: [
      "Sayfyho Memorial",
      "cyklistický závod",
      "Sayfy",
      "Teplice",
      "Město Hrob",
      "kola",
      "cyklistika",
      "závody",
    ],
    ogImage: { url: "/images/sayfy/og-image.jpg", alt: "Sayfyho Memorial" },
  },
  footerTagline: "Uvidíme se na startu",
};

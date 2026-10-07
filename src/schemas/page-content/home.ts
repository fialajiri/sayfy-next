import { z } from "zod";
import { imageRefSchema, linkSchema } from "./shared";

const factSchema = z.object({
  value: z.string().min(1).max(20),
  label: z.string().min(1).max(40),
});

export const homeContentSchema = z.object({
  hero: z.object({
    /** Supports {edition} and {year} tokens, filled from settings/results. */
    kicker: z.string().min(1).max(80),
    title: z.string().min(1).max(60),
    subtitle: z.string().max(160),
    video: z.object({
      mp4Url: z.string().min(1),
      webmUrl: z.string(),
      poster: imageRefSchema,
    }),
    secondaryCta: linkSchema,
  }),
  facts: z.tuple([factSchema, factSchema, factSchema]),
  memorial: z.object({
    quote: z.string().min(1).max(120),
    portrait: imageRefSchema,
    linkLabel: z.string().min(1).max(40),
  }),
  sections: z.object({
    newsTitle: z.string().min(1).max(40),
    resultsTitle: z.string().min(1).max(40),
    galleryTitle: z.string().min(1).max(40),
    partnersTitle: z.string().min(1).max(40),
  }),
  finishCta: z.object({
    title: z.string().min(1).max(60),
    text: z.string().max(200),
  }),
});
export type HomeContent = z.infer<typeof homeContentSchema>;

// Legacy copy: sayfy-hero.tsx, info-section.tsx (28. září · každý rok ·
// Královské Město Hrob), news-section.tsx.
export const DEFAULT_HOME_CONTENT: HomeContent = {
  hero: {
    kicker: "{edition}. ročník · Královské město Hrob",
    title: "Sayfyho Memorial",
    subtitle: "Cyklistický závod na památku Davida „Sayfyho“ Seifrta",
    video: {
      mp4Url: "/video/hero.mp4",
      webmUrl: "/video/hero.webm",
      poster: {
        url: "/video/hero-poster.jpg",
        alt: "Start závodu u fotbalového hřiště v Hrobu z dronu",
      },
    },
    secondaryCta: { label: "Propozice", href: "/propozice" },
  },
  facts: [
    { value: "28. září", label: "každý rok" },
    { value: "11:00", label: "start závodu" },
    { value: "Hrob", label: "Královské město" },
  ],
  memorial: {
    quote: "Aspoň jsem to zkusil",
    portrait: {
      url: "/images/sayfy/sayfy-profile.png",
      alt: "David „Sayfy“ Seifrt",
    },
    linkLabel: "Kdo byl Sayfy",
  },
  sections: {
    newsTitle: "Aktuality",
    resultsTitle: "Výsledky",
    galleryTitle: "Fotogalerie",
    partnersTitle: "Podporují nás",
  },
  finishCta: {
    title: "Pojeďte s námi",
    text: "Každý rok 28. září v 11:00, Královské město Hrob.",
  },
};

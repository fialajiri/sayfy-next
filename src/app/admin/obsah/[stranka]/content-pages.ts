// /admin/obsah/<slug> → which page-content document it edits.
export const CONTENT_PAGES = {
  uvod: {
    title: "Úvodní stránka",
    description: "Video, fakta, vzpomínka a nadpisy sekcí.",
  },
  sayfy: { title: "Kdo byl Sayfy", description: "Příběh, citát a fotografie." },
  kontakt: { title: "Kontakt", description: "Kontaktní osoby a místo konání." },
  podpora: { title: "Podpora", description: "Text nad logy partnerů." },
  web: {
    title: "Celý web",
    description: "Sociální sítě, popis pro vyhledávače a patička.",
  },
} as const;

export type ContentSlug = keyof typeof CONTENT_PAGES;

export function isContentSlug(value: string): value is ContentSlug {
  return Object.hasOwn(CONTENT_PAGES, value);
}

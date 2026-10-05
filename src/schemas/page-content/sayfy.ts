import { z } from "zod";
import { imageRefSchema, linkSchema, richTextSchema } from "./shared";

const chapterSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(80),
  body: richTextSchema,
  image: imageRefSchema.nullable(),
});

export const sayfyContentSchema = z.object({
  name: z.string().min(1).max(60),
  nickname: z.string().max(30),
  born: z.string().max(30),
  died: z.string().max(30),
  portrait: imageRefSchema,
  chapters: z.array(chapterSchema).min(1).max(12),
  quote: z.object({
    text: z.string().min(1).max(120),
    attribution: z.string().max(60),
  }),
  photos: z.array(imageRefSchema).max(40),
  closing: z.object({ text: z.string().max(300), link: linkSchema }),
});
export type SayfyContent = z.infer<typeof sayfyContentSchema>;
export type SayfyChapter = z.infer<typeof chapterSchema>;

const photo = (file: string, n: number) => ({
  url: `/images/sayfy/${file}`,
  alt: `David „Sayfy“ Seifrt, fotografie ${n}`,
});

// Legacy copy verbatim: sayfy-page.tsx + public/data/images.json.
export const DEFAULT_SAYFY_CONTENT: SayfyContent = {
  name: "David Seifrt",
  nickname: "Sayfy",
  born: "8. 2. 1991",
  died: "28. 9. 2008",
  portrait: photo("sayfy-profile.png", 0),
  chapters: [
    {
      id: "detstvi",
      title: "Od hokeje ke kolu",
      body: "<p>David Seifrt, přezdívaný Sayfy, se narodil 8. 2. 1991 v Teplicích. Již od nejútlejšího dětství bylo jasné, že z něj roste sportovec. Nejdříve trávil všechen mimoškolní (někdy i školní) čas na ledě v dresech HC Stadion Teplice, později HC Draci Bílina. Ovšem po čase hokej nahradila cyklistika, do které se Sayfy opravdu zamiloval.</p>",
      image: photo("sayfy-1.jpg", 1),
    },
    {
      id: "kariera",
      title: "Až do Dukly Praha",
      body: "<p>První úspěchy sklízel v týmu Top Ten Teplice, později přejmenovaný na Factor team. Po dvou letech vystoupil o stupínek výše do týmu TJ Stadion Louny – Zannela, kde se věnoval především silniční cyklistice a cyklocrossu. Svoji snahu dovršil tím, že byl přijat do profesionálního týmu Dukla Praha.</p>",
      image: photo("sayfy-9.jpg", 9),
    },
    {
      id: "heslo",
      title: "„Aspoň jsem to zkusil“",
      body: "<p>Snažil se vyhrávat a když to někdy nevyšlo, prohlásil své nejoblíbenější heslo: „ASPOŇ JSEM TO ZKUSIL“. Byl závodníkem, který i přes utržené šrámy neměl strach a na svého „šemíka“ nedal dopustit.</p>",
      image: photo("sayfy-5.jpg", 5),
    },
    {
      id: "memorial",
      title: "28. 9. 2008",
      body: "<p>David zemřel při tragické nehodě v neděli 28.9. 2008 v Krupce u Teplic. Pro uctění jeho památky každý rok pořádáme cyklistický závod SAYFYHO Memorial. Jak jinak by všichni měli strávit tento den než na kolech…</p>",
      image: photo("sayfy-7.jpg", 7),
    },
  ],
  quote: { text: "Aspoň jsem to zkusil", attribution: "David „Sayfy“ Seifrt" },
  photos: [
    photo("sayfy-1.jpg", 1),
    photo("sayfy-2-cropped.jpg", 2),
    photo("sayfy-3-cropped.jpg", 3),
    photo("sayfy-4.jpg", 4),
    photo("sayfy-5.jpg", 5),
    photo("sayfy-6.jpg", 6),
    photo("sayfy-7.jpg", 7),
    photo("sayfy-8.jpg", 8),
    photo("sayfy-9.jpg", 9),
  ],
  closing: {
    text: "Přijeďte uctít jeho památku — každý rok 28. září v Hrobu.",
    link: { label: "Propozice závodu", href: "/propozice" },
  },
};

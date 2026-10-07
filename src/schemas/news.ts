import { z } from "zod";

// Shared by the admin form (RHF resolver) and the server actions (docs/04 §Forms).
export const newsFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Zadejte nadpis.")
    .max(150, "Nadpis může mít nejvýše 150 znaků."),
  perex: z.string().trim().max(600, "Perex může mít nejvýše 600 znaků."),
  text: z.string().max(200_000, "Text je příliš dlouhý."),
  mainPhoto: z.string().min(1, "Aktualita musí mít hlavní obrázek."),
  photoGallery: z
    .array(z.string().min(1))
    .max(10, "Fotogalerie může mít nejvýše 10 obrázků."),
  /** Rename the URL too (old slug keeps redirecting). Ignored on create. */
  updateSlug: z.boolean(),
});

export type NewsFormInput = z.infer<typeof newsFormSchema>;

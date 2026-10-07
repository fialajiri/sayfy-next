import { z } from "zod";

export const galleryTitleSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Zadejte název.")
    .max(150, "Název může mít nejvýše 150 znaků."),
  /** Rename the URL too (old slug keeps redirecting). Ignored on create. */
  updateSlug: z.boolean(),
});

export const galleryImagesSchema = z.object({
  images: z.array(z.string().min(1)).max(1000),
  expectedUpdatedAt: z.iso.datetime(),
});

export const galleryAppendSchema = z.object({
  urls: z.array(z.string().min(1)).min(1).max(50),
});

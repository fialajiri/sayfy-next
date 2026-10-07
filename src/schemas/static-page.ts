import { z } from "zod";

export const staticPageFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Zadejte nadpis.")
    .max(150, "Nadpis může mít nejvýše 150 znaků."),
  text: z.string().max(300_000, "Text je příliš dlouhý."),
});

export type StaticPageFormInput = z.infer<typeof staticPageFormSchema>;

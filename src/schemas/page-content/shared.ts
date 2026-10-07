import { z } from "zod";

// An image is either a bundled default (/public path) or an uploaded S3 URL.
// Host/prefix validation of uploads happens in the write use case (Phase 5).
export const imageRefSchema = z.object({
  url: z
    .string()
    .min(1)
    .refine((v) => v.startsWith("/") || v.startsWith("https://"), {
      message: "Neplatná adresa obrázku",
    }),
  alt: z.string().max(300),
});
export type ImageRef = z.infer<typeof imageRefSchema>;

/** Sanitized HTML from the rich-text editor. */
export const richTextSchema = z.string().max(50_000);

export const linkSchema = z.object({
  label: z.string().min(1).max(60),
  href: z
    .string()
    .min(1)
    .max(500)
    .regex(
      /^(\/|https:\/\/|mailto:|tel:)/,
      "Odkaz musí začínat /, https://, mailto: nebo tel:",
    ),
});
export type LinkRef = z.infer<typeof linkSchema>;

export const optionalUrlSchema = z.union([
  z.literal(""),
  z.url({ protocol: /^https$/ }),
]);

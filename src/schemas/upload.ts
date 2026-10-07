import { z } from "zod";

// Per-prefix upload policy (docs/03 Upload, docs/08 §A3). The client picks a
// known prefix + a slug-like scope; it never supplies a path or key.
const IMAGE_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;
const DOCUMENT_MIME = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
] as const;
const VIDEO_MIME = ["video/mp4", "video/webm"] as const;

const MB = 1024 * 1024;
type Policy = { mime: readonly string[]; maxBytes: number };
const IMAGES: Policy = { mime: IMAGE_MIME, maxBytes: 15 * MB };

export const UPLOAD_POLICIES = {
  aktuality: IMAGES,
  galerie: IMAGES,
  propozice: IMAGES,
  partners: IMAGES,
  stranky: IMAGES,
  soubory: { mime: DOCUMENT_MIME, maxBytes: 20 * MB },
  media: { mime: VIDEO_MIME, maxBytes: 60 * MB },
} as const satisfies Record<string, Policy>;

export type UploadPrefix = keyof typeof UPLOAD_POLICIES;
export const UPLOAD_PREFIXES = Object.keys(UPLOAD_POLICIES) as [
  UploadPrefix,
  ...UploadPrefix[],
];
export const MAX_FILES_PER_REQUEST = 50;

const fileSchema = z.object({
  name: z.string().trim().min(1).max(255),
  type: z.string().min(1).max(120),
  size: z.number().int().positive(),
});

export const presignRequestSchema = z
  .object({
    prefix: z.enum(UPLOAD_PREFIXES),
    scope: z.string().regex(/^[a-z0-9-]{1,80}$/, "Neplatný rozsah."),
    files: z.array(fileSchema).min(1).max(MAX_FILES_PER_REQUEST),
  })
  .superRefine((body, ctx) => {
    const policy: Policy = UPLOAD_POLICIES[body.prefix];
    body.files.forEach((file, index) => {
      if (!policy.mime.includes(file.type)) {
        ctx.addIssue({
          code: "custom",
          path: ["files", index, "type"],
          message: "Nepodporovaný typ souboru.",
        });
      }
      if (file.size > policy.maxBytes) {
        ctx.addIssue({
          code: "custom",
          path: ["files", index, "size"],
          message: "Soubor je příliš velký.",
        });
      }
    });
  });

export type PresignRequest = z.infer<typeof presignRequestSchema>;

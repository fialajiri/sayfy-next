import { z } from "zod";

const httpsUrl = z.url({
  protocol: /^https$/,
  error: "Zadejte adresu začínající https://.",
});

export const settingsFormSchema = z.object({
  registrationUrl: httpsUrl,
  registrationOpen: z.boolean(),
  /** Empty = derived from the latest result (+1). */
  editionOverride: z.number().int().min(1).max(500).nullable(),
});
export type SettingsFormInput = z.infer<typeof settingsFormSchema>;

export const resultFormSchema = z.object({
  year: z
    .number({ error: "Zadejte rok." })
    .int()
    .min(2009, "Rok musí být 2009 nebo později.")
    .max(2100),
  edition: z.number({ error: "Zadejte ročník." }).int().min(1).max(500),
  url: httpsUrl,
  note: z.string().trim().max(200),
});
export type ResultFormInput = z.infer<typeof resultFormSchema>;

export const partnerFormSchema = z.object({
  name: z.string().trim().min(1, "Zadejte název partnera.").max(100),
  logoUrl: z.string().min(1, "Nahrajte logo."),
  url: z.union([z.literal(""), httpsUrl]),
});
export type PartnerFormInput = z.infer<typeof partnerFormSchema>;

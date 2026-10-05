import { z } from "zod";
import { richTextSchema } from "./shared";

const contactSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(80),
  role: z.string().max(80),
  phone: z.string().max(30),
  email: z.union([z.literal(""), z.email()]),
});

export const kontaktContentSchema = z.object({
  title: z.string().min(1).max(80),
  lead: z.string().max(200),
  contacts: z.array(contactSchema).min(1).max(6),
  place: z.object({
    label: z.string().min(1).max(80),
    mapUrl: z.string().max(500),
  }),
  extra: richTextSchema,
});
export type KontaktContent = z.infer<typeof kontaktContentSchema>;
export type Contact = z.infer<typeof contactSchema>;

// Legacy copy: Kontakt.tsx.
export const DEFAULT_KONTAKT_CONTENT: KontaktContent = {
  title: "Máte chuť se zapojit?",
  lead: "Neváhejte se ozvat!",
  contacts: [
    {
      id: "nikola",
      name: "Nikola Fialová Seifrtová",
      role: "",
      phone: "+420 607 720 869",
      email: "seifrtovanikola@gmail.com",
    },
  ],
  place: { label: "město Hrob", mapUrl: "https://mapy.cz/zakladni?q=Hrob" },
  extra: "",
};

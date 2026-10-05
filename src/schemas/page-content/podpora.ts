import { z } from "zod";
import { richTextSchema } from "./shared";

export const podporaContentSchema = z.object({
  title: z.string().min(1).max(80),
  lead: richTextSchema,
});
export type PodporaContent = z.infer<typeof podporaContentSchema>;

// Legacy copy: support-page.tsx.
export const DEFAULT_PODPORA_CONTENT: PodporaContent = {
  title: "Podporují nás",
  lead: "",
};

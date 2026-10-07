import { slugify } from "@/server/domain/slug";

// Client-side preview only — the server picks the final unique slug.
export function slugPreview(title: string): string {
  return slugify(title);
}

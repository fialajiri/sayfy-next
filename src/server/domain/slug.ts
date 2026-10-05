// URL slugs for NEW content. Existing legacy slugs (which may contain "!", ","
// and ".") are never rewritten — they are live public URLs (docs/05).

const MAX_SLUG_LENGTH = 80;

export function slugify(input: string): string {
  const slug = input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, "");
  return slug || "polozka";
}

// First free slug: base, base-2, base-3, … `isTaken` is the repository check.
export async function uniqueSlug(
  base: string,
  isTaken: (candidate: string) => Promise<boolean>,
): Promise<string> {
  const root = slugify(base);
  if (!(await isTaken(root))) return root;
  for (let n = 2; ; n++) {
    const candidate = `${root}-${n}`;
    if (!(await isTaken(candidate))) return candidate;
  }
}

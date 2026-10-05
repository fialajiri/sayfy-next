export type StaticPageDto = {
  id: string;
  title: string;
  text: string;
  updatedAt: string | null;
};

export type StaticPageRepository = {
  findBySlug(slug: string): Promise<StaticPageDto | null>;
};

// Legacy propozice document; looked up by id until the `slug` field is seeded.
export const PROPOZICE_SLUG = "propozice";
export const PROPOZICE_LEGACY_ID = "635c21aea369bc4f74025d04";

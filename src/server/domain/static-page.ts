export type StaticPageDto = {
  id: string;
  title: string;
  text: string;
  updatedAt: string | null;
};

export type StaticPageRecord = {
  id: string;
  title: string;
  text: string;
  assets: string[];
  updatedAt: string | null;
};

export type StaticPageRepository = {
  findBySlug(slug: string): Promise<StaticPageDto | null>;
  findRecordBySlug(slug: string): Promise<StaticPageRecord | null>;
  update(
    id: string,
    input: { title: string; text: string; assets: string[] },
  ): Promise<StaticPageRecord | null>;
};

// Legacy propozice document; looked up by id until the `slug` field is seeded.
export const PROPOZICE_SLUG = "propozice";
export const PROPOZICE_LEGACY_ID = "635c21aea369bc4f74025d04";

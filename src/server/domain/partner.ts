export type PartnerDto = {
  id: string;
  name: string;
  logoUrl: string;
  url: string | null;
};

export type PartnerRepository = {
  /** Ordered for display. Empty until partners are seeded (Phase 5). */
  list(): Promise<PartnerDto[]>;
  // admin
  listRaw(): Promise<PartnerRecord[]>;
  findById(id: string): Promise<PartnerRecord | null>;
  create(input: PartnerInput): Promise<PartnerRecord>;
  update(id: string, input: PartnerInput): Promise<PartnerRecord | null>;
  delete(id: string): Promise<PartnerRecord | null>;
  /** Persist display order: ids[0] first. */
  reorder(ids: string[]): Promise<void>;
};

export type PartnerInput = { name: string; logoUrl: string; url: string };
/** Admin view with the raw stored logo URL. */
export type PartnerRecord = {
  id: string;
  name: string;
  logoUrl: string;
  url: string;
  order: number;
};

// Legacy logos bundled in /public (shown until partners are seeded into the
// DB). Names identified from the logo artwork; links still to be supplied.
const LEGACY_NAMES: Record<number, string> = {
  2: "Sayfyho Memorial",
  4: "Olympia Teplice",
  5: "Kolakola",
  6: "Město Hrob",
  7: "Mature Teplice",
  8: "Bombus",
  10: "Edgewell Personal Care",
  11: "Krušnohoří",
  12: "Statutární město Teplice",
};

export const LEGACY_PARTNERS: readonly PartnerDto[] = Object.entries(
  LEGACY_NAMES,
).map(([n, name]) => ({
  id: `legacy-${n}`,
  name,
  logoUrl: `/partners/${n}-transparent.png`,
  url: null,
}));

export type PartnerDto = {
  id: string;
  name: string;
  logoUrl: string;
  url: string | null;
};

export type PartnerRepository = {
  /** Ordered for display. Empty until partners are seeded (Phase 5). */
  list(): Promise<PartnerDto[]>;
};

// Legacy logos bundled in /public until Phase 5 migrates them to the DB.
// Real names/links are still to be supplied by the organisers (07 Q2).
export const LEGACY_PARTNERS: readonly PartnerDto[] = [
  2, 4, 5, 6, 7, 8, 10, 11, 12,
].map((n, index) => ({
  id: `legacy-${n}`,
  name: `Partner ${index + 1}`,
  logoUrl: `/partners/${n}-transparent.png`,
  url: null,
}));

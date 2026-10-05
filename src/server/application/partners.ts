import {
  LEGACY_PARTNERS,
  type PartnerDto,
  type PartnerRepository,
} from "@/server/domain/partner";

// Until Phase 5 migrates partners to the DB, an empty collection falls back to
// the legacy bundled logos so the page never goes blank.
export async function listPartners(
  repo: PartnerRepository,
): Promise<PartnerDto[]> {
  try {
    const partners = await repo.list();
    return partners.length > 0 ? partners : [...LEGACY_PARTNERS];
  } catch {
    return [...LEGACY_PARTNERS];
  }
}

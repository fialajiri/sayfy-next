import {
  err,
  notFound,
  ok,
  unexpected,
  type Result,
} from "@/server/domain/result";
import {
  PROPOZICE_SLUG,
  type StaticPageDto,
  type StaticPageRepository,
} from "@/server/domain/static-page";

export async function getPropozice(
  repo: StaticPageRepository,
): Promise<Result<StaticPageDto>> {
  try {
    const page = await repo.findBySlug(PROPOZICE_SLUG);
    return page ? ok(page) : err(notFound("Propozice nenalezeny."));
  } catch {
    return err(unexpected("Nepodařilo se načíst propozice."));
  }
}

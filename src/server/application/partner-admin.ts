import { z } from "zod";
import { partnerFormSchema } from "@/schemas/race-admin";
import {
  isOwnUpload,
  storageKeys,
  type UploadOrigin,
} from "@/server/domain/assets";
import type { PartnerRecord, PartnerRepository } from "@/server/domain/partner";
import {
  err,
  notFound,
  ok,
  unexpected,
  validation,
  type DomainError,
  type Result,
} from "@/server/domain/result";
import type { StoragePort } from "@/server/domain/storage";

export type PartnerAdminDeps = {
  partners: PartnerRepository;
  storage: Pick<StoragePort, "deleteMany">;
  origin: UploadOrigin;
};

// Bundled legacy logos (/public/partners/…) stay valid until replaced.
const BUNDLED_LOGO = /^\/partners\/[\w-]+\.(png|webp|svg|jpg)$/;

function acceptableLogo(
  url: string,
  previous: string | null,
  origin: UploadOrigin,
): boolean {
  return (
    url === previous ||
    BUNDLED_LOGO.test(url) ||
    isOwnUpload(url, origin, ["partners"])
  );
}

async function removeLogo(deps: PartnerAdminDeps, url: string) {
  // Only our own partner uploads are ever deleted (never bundled/legacy files).
  if (!isOwnUpload(url, deps.origin, ["partners"])) return;
  try {
    await deps.storage.deleteMany(storageKeys([url], deps.origin.hosts));
  } catch {
    console.error("[partners] logo cleanup failed");
  }
}

export async function savePartner(
  deps: PartnerAdminDeps,
  id: string | null,
  input: unknown,
): Promise<Result<PartnerRecord, DomainError>> {
  const parsed = partnerFormSchema.safeParse(input);
  if (!parsed.success)
    return err(
      validation(
        "Zkontrolujte zadané údaje.",
        z.flattenError(parsed.error).fieldErrors,
      ),
    );
  try {
    const previous = id ? await deps.partners.findById(id) : null;
    if (id && !previous) return err(notFound("Partner nenalezen."));
    if (
      !acceptableLogo(
        parsed.data.logoUrl,
        previous?.logoUrl ?? null,
        deps.origin,
      )
    ) {
      return err(
        validation("Neplatné logo.", { logoUrl: ["Nahrajte logo znovu."] }),
      );
    }
    const saved = id
      ? await deps.partners.update(id, parsed.data)
      : await deps.partners.create(parsed.data);
    if (!saved) return err(notFound("Partner nenalezen."));
    if (previous && previous.logoUrl !== saved.logoUrl)
      await removeLogo(deps, previous.logoUrl);
    return ok(saved);
  } catch {
    return err(unexpected("Partnera se nepodařilo uložit."));
  }
}

export async function deletePartner(
  deps: PartnerAdminDeps,
  id: string,
): Promise<Result<PartnerRecord, DomainError>> {
  try {
    const deleted = await deps.partners.delete(id);
    if (!deleted) return err(notFound("Partner nenalezen."));
    await removeLogo(deps, deleted.logoUrl);
    return ok(deleted);
  } catch {
    return err(unexpected("Partnera se nepodařilo smazat."));
  }
}

export async function reorderPartners(
  deps: PartnerAdminDeps,
  ids: unknown,
): Promise<Result<true, DomainError>> {
  const parsed = z
    .array(z.string().regex(/^[0-9a-f]{24}$/))
    .max(200)
    .safeParse(ids);
  if (!parsed.success) return err(validation("Neplatné pořadí."));
  try {
    const known = new Set((await deps.partners.listRaw()).map((p) => p.id));
    if (
      parsed.data.length !== known.size ||
      parsed.data.some((id) => !known.has(id))
    )
      return err(
        validation("Seznam partnerů se mezitím změnil. Načtěte stránku znovu."),
      );
    await deps.partners.reorder(parsed.data);
    return ok(true);
  } catch {
    return err(unexpected("Pořadí se nepodařilo uložit."));
  }
}

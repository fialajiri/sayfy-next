import { z } from "zod";
import { resultFormSchema, settingsFormSchema } from "@/schemas/race-admin";
import type {
  RaceResultDto,
  RaceResultRepository,
} from "@/server/domain/race-result";
import {
  err,
  notFound,
  ok,
  unexpected,
  validation,
  type DomainError,
  type Result,
} from "@/server/domain/result";
import type {
  SettingsRepository,
  SiteSettingsDto,
} from "@/server/domain/settings";

const invalid = (error: z.ZodError) =>
  err(
    validation("Zkontrolujte zadané údaje.", z.flattenError(error).fieldErrors),
  );

export async function updateSettings(
  repo: Pick<SettingsRepository, "save">,
  input: unknown,
): Promise<Result<SiteSettingsDto, DomainError>> {
  const parsed = settingsFormSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  try {
    await repo.save(parsed.data);
    return ok(parsed.data);
  } catch {
    return err(unexpected("Nastavení se nepodařilo uložit."));
  }
}

/** Quick toggle from the dashboard; keeps the other settings as they are. */
export async function setRegistrationOpen(
  repo: Pick<SettingsRepository, "find" | "save">,
  defaults: SiteSettingsDto,
  open: unknown,
): Promise<Result<SiteSettingsDto, DomainError>> {
  if (typeof open !== "boolean") return err(validation("Neplatná hodnota."));
  try {
    const next = {
      ...defaults,
      ...(await repo.find()),
      registrationOpen: open,
    };
    await repo.save(next);
    return ok(next);
  } catch {
    return err(unexpected("Registraci se nepodařilo přepnout."));
  }
}

export async function saveResult(
  repo: RaceResultRepository,
  id: string | null,
  input: unknown,
): Promise<Result<RaceResultDto, DomainError>> {
  const parsed = resultFormSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  try {
    if (await repo.yearTaken(parsed.data.year, id ?? undefined)) {
      return err(
        validation("Výsledky pro tento rok už existují.", {
          year: ["Rok už má výsledky."],
        }),
      );
    }
    const saved = id
      ? await repo.update(id, parsed.data)
      : await repo.create(parsed.data);
    return saved ? ok(saved) : err(notFound("Výsledky nenalezeny."));
  } catch {
    return err(unexpected("Výsledky se nepodařilo uložit."));
  }
}

export async function deleteResult(
  repo: RaceResultRepository,
  id: string,
): Promise<Result<RaceResultDto, DomainError>> {
  try {
    const deleted = await repo.delete(id);
    return deleted ? ok(deleted) : err(notFound("Výsledky nenalezeny."));
  } catch {
    return err(unexpected("Výsledky se nepodařilo smazat."));
  }
}

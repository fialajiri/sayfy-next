// Site-wide race settings. The race date is NOT here: it's fixed (28. 9.
// 11:00 Prague) and computed by `race-status.ts`.
export type SiteSettingsDto = {
  registrationUrl: string;
  registrationOpen: boolean;
  /** Ročník override; null = derived from the latest result (+1). */
  editionOverride: number | null;
};

export type SettingsRepository = {
  /** Stored settings, or null when the singleton doc doesn't exist yet. */
  find(): Promise<Partial<SiteSettingsDto> | null>;
};

// Fallback so a missing document never breaks the home page.
export const DEFAULT_SETTINGS: SiteSettingsDto = {
  registrationUrl: "https://sportt.cz/register/1544",
  registrationOpen: false,
  editionOverride: null,
};

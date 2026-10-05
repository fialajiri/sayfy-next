export type RaceResultDto = {
  id: string;
  year: number;
  /** Ročník — stored, never computed (2021/22 were skipped). */
  edition: number;
  url: string;
  note: string | null;
  /** True when the URL may be iframed under our CSP (sportt.cz only). */
  embeddable: boolean;
};

export type RaceResultRepository = {
  /** Newest year first. */
  list(): Promise<RaceResultDto[]>;
  findByYear(year: number): Promise<RaceResultDto | null>;
};

const EMBEDDABLE_HOSTS = ["sportt.cz", "www.sportt.cz"];

export function isEmbeddableResultUrl(url: string): boolean {
  if (!URL.canParse(url)) return false;
  const parsed = new URL(url);
  return (
    parsed.protocol === "https:" && EMBEDDABLE_HOSTS.includes(parsed.hostname)
  );
}

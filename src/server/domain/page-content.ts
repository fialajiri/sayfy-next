export type PageContentRepository = {
  /** Raw stored data for a page key, or null. Validated by the use case. */
  findRaw(key: string): Promise<unknown>;
  save(key: string, data: unknown): Promise<void>;
};
